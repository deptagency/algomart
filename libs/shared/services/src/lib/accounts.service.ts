import {
  AlgorandTransactionStatus,
  ApplicantCreate,
  ApplicantOnfidoAPIRequest,
  CreateUserAccountRequest,
  DEFAULT_LANG,
  NotificationType,
  PublicAccount,
  SortDirection,
  UpdateUserAccount,
  UserAccount,
  UserAccounts,
  UserAccountStatus,
  UserEmail,
  UserExternalIdObject,
  Username,
  UserSortField,
  UserStatusReport,
  UsersVerificationQuerystring,
  UserTotalsReport,
} from '@algomart/schemas'
import {
  AlgorandAdapter,
  IpGeolocationAdapter,
  OnfidoAdapter,
} from '@algomart/shared/adapters'
import {
  decodeRawSignedTransaction,
  isTransactionDeadError,
} from '@algomart/shared/algorand'
import {
  AlgorandAccountModel,
  CollectibleListingsModel,
  CollectibleModel,
  CollectibleOwnershipModel,
  NotificationModel,
  PackModel,
  PaymentCardModel,
  PaymentModel,
  UserAccountModel,
  UserAccountTransferModel,
} from '@algomart/shared/models'
import { SubmitKycMonitorQueue } from '@algomart/shared/queues'
import {
  FailedPostgresWriteAssertionError,
  invariant,
  isRestrictedPurchase,
  UserError,
  userInvariant,
} from '@algomart/shared/utils'
import { UnrecoverableError } from 'bullmq'
import admin from 'firebase-admin'
import { Model, UniqueViolationError } from 'objection'
import pino from 'pino'

import { AlgorandTransactionsService } from './algorand-transactions.service'
import { NotificationsService, PaymentsService } from './'

export class AccountsService {
  logger: pino.Logger<unknown>

  constructor(
    private readonly algorand: AlgorandAdapter,
    private readonly ipGeolocation: IpGeolocationAdapter,
    private readonly onfido: OnfidoAdapter,
    private readonly payments: PaymentsService,
    private readonly notifications: NotificationsService,
    private readonly transactions: AlgorandTransactionsService,
    private readonly submitKycMonitorQueue: SubmitKycMonitorQueue,
    logger: pino.Logger<unknown>
  ) {
    this.logger = logger.child({ context: this.constructor.name })
  }

  async create(
    externalId: string,
    request: CreateUserAccountRequest,
    ipAddress: string
  ) {
    // 1. Check for an externalId collision
    const existing = await UserAccountModel.query()
      .findOne({
        externalId,
      })
      .withGraphJoined('algorandAccount.creationTransaction')

    if (existing) {
      return this.mapPublicAccount(existing)
    }

    if (request.username) {
      // 2. Check for a username collision
      const usernameExists = await UserAccountModel.query()
        .findOne({
          username: request.username,
        })
        .first()

      userInvariant(!usernameExists, 'username already exists', 409)
    }

    // 3. Get user's country based on IP address
    const countryCode = await this.ipGeolocation.getCountryCodeByIpAddress(
      ipAddress
    )

    // 4. generate algorand account (i.e. wallet)
    const result = await this.algorand.generateAccount()

    // 5. save account with encrypted mnemonic
    await UserAccountModel.query().insertGraph({
      algorandAccount: {
        address: result.address,
        encryptedKey: result.encryptedMnemonic,
      },
      balance: 0,
      countryCode,
      currency: request.currency,
      email: request.email,
      externalId,
      language: request.language || DEFAULT_LANG,
      provider: request.provider,
      username: request.username,
      verificationStatus: UserAccountStatus.Unverified,
    })

    // 6. return "public" user account
    const userAccount = await UserAccountModel.query()
      .findOne({
        externalId,
      })
      .withGraphJoined('algorandAccount.creationTransaction')

    return this.mapPublicAccount(userAccount)
  }

  async updateAccount(
    userId: string,
    { email, showProfile, username, language, currency, age }: UpdateUserAccount
  ) {
    try {
      const result = await UserAccountModel.query().findById(userId).patch({
        currency,
        email,
        language,
        showProfile,
        username,
        age,
      })
      userInvariant(result === 1, 'user account not found', 404)
    } catch (error) {
      if (error instanceof UniqueViolationError) {
        throw new UserError('Username unavailable', 409)
      }
      throw error
    }
  }

  async deleteTestAccount(usernames: string[]) {
    const userIDs = [],
      algorandIDs = []

    // Grab the test user account and its ID
    const users = await UserAccountModel.query()
      .where('username', 'in', usernames)
      .limit(2)

    // Allow graceful failing if the user doesn't exist
    if (users.length === 0) return

    for (const { id, algorandAccountId } of users) {
      userIDs.push(id)
      algorandIDs.push(algorandAccountId)
    }

    // if (packs.length > 0) {
    // Delete the collectibles and collectible ownership records specified
    await CollectibleOwnershipModel.query()
      .delete()
      .where('ownerId', 'in', userIDs)
    await CollectibleListingsModel.query()
      .delete()
      .where('sellerId', 'in', userIDs)
    await CollectibleListingsModel.query()
      .patch({ buyerId: null })
      .where('buyerId', 'in', userIDs)
    await CollectibleModel.query().delete().where('ownerId', 'in', userIDs)
    // }

    // Delete the payment records
    await PaymentModel.query().delete().where('payerId', 'in', userIDs)
    // Delete the payment card(s)
    await PaymentCardModel.query().delete().where('ownerId', 'in', userIDs)
    // Delete the transfer record
    await UserAccountTransferModel.query()
      .delete()
      .where('userAccountId', 'in', userIDs)
      .limit(2)
    // Delete the notification record
    await NotificationModel.query()
      .where('userAccountId', 'in', userIDs)
      .delete()
    // Disassociate the user account from the pack. We remove the owner instead of delete in order to keep the total number of packs correct
    await PackModel.query()
      .patch({ ownerId: null })
      .where('ownerId', 'in', userIDs)
      .limit(2)

    // Delete the user account, throwing if there is an error
    await UserAccountModel.query().delete().where('id', 'in', userIDs).limit(2)

    // Delete the algorand account associated with the test user account, throwing if there is an error
    await AlgorandAccountModel.query()
      .delete()
      .where('id', 'in', algorandIDs)
      .limit(2)
  }

  // Create/ sign the algorand transactions necessary to fund a user account
  // and record them for later submission.
  async generateAccountFundingTransactionsAndWriteToDbIfNecessary(
    userAccount: UserAccountModel
  ) {
    // generate transactions to fund the account and opt-out of staking rewards
    const { signedTransactions, transactionIds } =
      await this.algorand.initialFundTransactions(
        userAccount.algorandAccount.encryptedKey
      )

    // store signed transactions for later sending
    const trx = await Model.startTransaction()
    let newCreationTransactionId = null
    try {
      const { transactions } = await this.transactions.saveSignedTransactions(
        signedTransactions,
        transactionIds,
        trx
      )

      // update algorand account
      const affectedRows = await AlgorandAccountModel.query(trx)
        .patch({
          creationTransactionId: transactions[0].id,
        })
        .where({
          id: userAccount.algorandAccountId,
          // if another process has already set the creationTransactionId then we no-op
          // avoids race conditions
          creationTransactionId: null,
        })

      if (affectedRows) {
        newCreationTransactionId = transactions[0].id
      } else {
        // if we didn't write any new rows then throw so that we rollback
        throw new FailedPostgresWriteAssertionError()
      }

      await trx.commit()
    } catch (error) {
      await trx.rollback()
      if (!(error instanceof FailedPostgresWriteAssertionError)) {
        // if a write assertion caused the error, then just no-op. Otherwise throw.
        throw error
      }
    }

    return newCreationTransactionId
  }

  // Funds a users Algorand account with initial funds if it's not already funded
  async ensureAccountMinBalance(userId: string) {
    let userAccount = await UserAccountModel.query()
      .findById(userId)
      .withGraphJoined('algorandAccount.creationTransaction')

    invariant(
      userAccount,
      `user account ${userId} not found`,
      UnrecoverableError
    )
    invariant(
      userAccount.algorandAccount,
      `user account ${userId} missing algorand account`,
      UnrecoverableError
    )

    // If there's already a *confirmed* creation transaction, no-op and move on to next step
    if (
      userAccount.algorandAccount.creationTransaction?.status ===
      AlgorandTransactionStatus.Confirmed
    ) {
      return
    }

    // Ensure minimum fund transactions are added to the algorand ledger.
    //
    // Important: We may need to create new transactions, or we may be picking up the task from another
    // failed process. Also other processes may be running concurrently which are doing the same work.
    // We need to take care not to overwrite another processes transactions in our database or double-fund
    // the account.
    //
    // Strategy to avoid double funding is essentially that once we've recorded the signed transactions to fund
    // the account in our database, we never submit new transactions. We only try to re-submit the same ones. (and
    // Algorand will not allow the same transaction to be submitted twice)

    // 1.) Create new funding transactions and record in database (if there's not already some there)
    if (!userAccount.algorandAccount.creationTransaction) {
      // note: this function is named "...IfNecessary" because, in the event of a race condition, two concurrent
      // workers could evaluate this conditional to true and call the function, but it would correctly no-op in all but
      // one of said processes in that rare event.
      await this.generateAccountFundingTransactionsAndWriteToDbIfNecessary(
        userAccount
      )
    }

    // Refetch the user account to read the funding transactions (they might've just been created in step 1)
    userAccount = await UserAccountModel.query()
      .findById(userId)
      .withGraphFetched(
        'algorandAccount.creationTransaction.group.transactions(orderAscByOrderField)'
      )

    const transactionIds = []
    const signedTransactions = []
    const transactionRecords =
      userAccount.algorandAccount.creationTransaction.group.transactions

    for (const algorandTrxRecord of transactionRecords) {
      transactionIds.push(algorandTrxRecord.address)
      signedTransactions.push(
        decodeRawSignedTransaction(algorandTrxRecord.encodedSignedTransaction)
      )
    }

    // Step 2: So, they might've just been created, or they might've been created by another worker
    // Also, they might've already failed or succeeded by now if they were created by another worker.
    // Regardless, we'll submit (or possibly re-submit) them and check their status
    // (see function implementation for more comments)
    try {
      await this.transactions.submitAndWaitForTransactionsIfNecessary(
        signedTransactions,
        transactionIds
      )
    } catch (error) {
      // Special case: if a submission failed because the transaction was created too many rounds ago,
      // then it is safe to clear out the recorded transactions so that a retry can re-create them.
      if (isTransactionDeadError(error)) {
        await this.transactions.clearCreationTransactionIdFromAlgorandAccount(
          userAccount.algorandAccountId
        )

        await this.transactions.deleteTransactionGroup(
          transactionRecords[0].groupId
        )
      }
      throw error
    }
  }

  private mapPublicAccount(
    userAccount: UserAccount | null | undefined
  ): PublicAccount {
    userInvariant(userAccount, 'user account not found', 404)

    invariant(userAccount.algorandAccount, 'algorand account not loaded')
    return {
      id: userAccount.id,
      address: userAccount.algorandAccount.address,
      age: userAccount.age,
      balance: userAccount.balance,
      currency: userAccount.currency,
      externalId: userAccount.externalId,
      email: userAccount.email,
      language: userAccount.language,
      provider: userAccount.provider,
      showProfile: userAccount.showProfile,
      status: userAccount.algorandAccount.creationTransaction
        ? userAccount.algorandAccount.creationTransaction.status
        : undefined,
      username: userAccount.username,
      applicantId: userAccount.applicantId,
      verificationStatus: userAccount.verificationStatus,
      lastWorkflowRunId: userAccount.lastWorkflowRunId,
      lastVerified: userAccount.lastVerified || undefined,
      recentWatchlistBreakdown:
        userAccount.recentWatchlistBreakdown || undefined,
      watchlistMonitorId: userAccount.watchlistMonitorId,
    }
  }

  async getByExternalId(request: UserExternalIdObject) {
    const userAccount = await UserAccountModel.query()
      .findOne({
        externalId: request.userExternalId,
      })
      .withGraphJoined('algorandAccount.creationTransaction')

    return this.mapPublicAccount(userAccount)
  }

  async getByUsername(request: Username) {
    const userAccount = await UserAccountModel.query()
      .findOne({
        username: request.username,
      })
      .withGraphJoined('algorandAccount.creationTransaction')

    return this.mapPublicAccount(userAccount)
  }

  async getByEmail(request: UserEmail) {
    const userAccount = await UserAccountModel.query()
      .findOne({
        email: request.email,
      })
      .withGraphJoined('algorandAccount.creationTransaction')

    return this.mapPublicAccount(userAccount)
  }

  async getAvatarByUsername(request: Username) {
    const userAccount = await UserAccountModel.query()
      .findOne({
        username: request.username,
      })
      .select('externalId')

    const firebaseProfile = await admin.auth().getUser(userAccount.externalId)
    return { profileAvatar: firebaseProfile.photoURL || null }
  }

  // #region sending emails
  async sendPasswordReset(email: string) {
    try {
      const user = await UserAccountModel.query().findOne({
        email,
      })
      if (user) {
        await this.sendEmailPasswordReset(user)
      }
    } catch {
      // don't do anything
    }
  }

  async sendEmailPasswordReset(user: UserAccount) {
    const firebaseAuth = admin.auth()
    const firebaseLink = await firebaseAuth.generatePasswordResetLink(
      user.email
    )
    const url = new URL(firebaseLink)
    const mode = url.searchParams.get('mode')
    const oobCode = url.searchParams.get('oobCode')
    const apiKey = url.searchParams.get('apiKey')
    const resetLink = `/reset-password?mode=${mode}&oobCode=${oobCode}&apiKey=${apiKey}`
    await this.notifications.createNotification({
      userAccountId: user.id,
      type: NotificationType.EmailPasswordReset,
      variables: {
        resetLink,
      },
    })
  }

  async sendNewEmailVerification(user: UserAccount) {
    try {
      const firebaseAuth = admin.auth()
      // Send them an email from our notification service with a link to reset password
      const firebaseLink = await firebaseAuth.generateEmailVerificationLink(
        user.email
      )
      const url = new URL(firebaseLink)
      const oobCode = url.searchParams.get('oobCode')
      const apiKey = url.searchParams.get('apiKey')
      const verificationLink = `/verify-email?&oobCode=${oobCode}&apiKey=${apiKey}`
      await this.notifications.createNotification({
        userAccountId: user.id,
        type: NotificationType.NewEmailVerification,
        variables: {
          verificationLink,
        },
      })
    } catch (error) {
      this.logger.error(error)
    }
  }
  // #endregion

  // #region KYC

  private async findPaymentTotalsForUser(
    userAccount: UserAccount
  ): Promise<UserTotalsReport> {
    // Find payer
    const totals = await this.payments.getUserKycTotals(userAccount.id)
    return {
      userExternalId: userAccount.externalId,
      totalAmountSpent: totals.all,
      amountSpentInLast24Hours: totals.daily,
      userBalance: userAccount.balance,
    }
  }

  async getUserStatus(userAccount: UserAccount): Promise<UserStatusReport> {
    // The user needs to complete KYC if they've reached Circle's limits
    const kycTotals = await this.findPaymentTotalsForUser(userAccount)
    const {
      isRestricted,
      dailyAmountBeforeVerification,
      totalAmountBeforeVerification,
    } = isRestrictedPurchase(
      kycTotals.amountSpentInLast24Hours,
      kycTotals.totalAmountSpent
    )

    // Check if KYC verification is enabled
    const status = this.onfido.isEnabled
      ? userAccount.verificationStatus
      : UserAccountStatus.Unverified

    // Update status if the verification was unverified and now has a different status
    if (
      userAccount.verificationStatus === UserAccountStatus.Unverified &&
      status !== userAccount.verificationStatus
    ) {
      await UserAccountModel.query().patchAndFetchById(userAccount.id, {
        verificationStatus: status,
      })
    }

    return {
      status,
      isVerificationEnabled: this.onfido.isEnabled,
      isVerificationRequired: isRestricted,
      dailyAmountBeforeVerification,
      totalAmountBeforeVerification,
    }
  }

  async getApplicant(userAccount: UserAccount) {
    const isVerificationEnabled = this.onfido.isEnabled
    userInvariant(isVerificationEnabled, 'verification not enabled', 404)

    const { applicantId, lastWorkflowRunId: workflowRunId } = userAccount || {}
    invariant(
      applicantId && workflowRunId,
      'applicant and workflow IDs are required'
    )

    // Retrieve applicant details
    const applicant = await this.onfido.getApplicant(applicantId)
    invariant(applicant, 'Applicant not found')

    // Retrieve workflow details
    const workflow = await this.getWorkflowDetails(workflowRunId)
    invariant(workflow, 'Workflow not found')

    return {
      ...applicant,
      workflow,
    }
  }

  async getApplicantToken(userAccount: UserAccount) {
    const isVerificationEnabled = this.onfido.isEnabled
    userInvariant(isVerificationEnabled, 'verification not enabled', 404)
    userInvariant(userAccount?.applicantId, 'applicant not found', 404)

    // Get new Onfido applicant token
    const response = await this.onfido.getToken(userAccount.applicantId)
    invariant(response?.token, 'applicant token not created')

    return response
  }

  /**
   * Request manual review for an account marked as "Restricted". This will
   * list the user account in the KYC dashboard in the CMS. An admin can mark
   * the account as "Banned" to prevent further manual review requests.
   * @param userAccount User account to modify
   */
  async requestManualReview(userAccount: UserAccount) {
    const isVerificationEnabled = this.onfido.isEnabled
    userInvariant(isVerificationEnabled, 'verification not enabled', 404)
    userInvariant(userAccount?.applicantId, 'applicant not found', 404)

    await UserAccountModel.query()
      .findById(userAccount.id)
      .where({
        verificationStatus: UserAccountStatus.Restricted,
      })
      .patch({
        verificationStatus: UserAccountStatus.ManualReview,
      })
  }

  async createApplicant(userAccount: UserAccount, request: ApplicantCreate) {
    const isVerificationEnabled = this.onfido.isEnabled
    userInvariant(isVerificationEnabled, 'verification not enabled', 404)

    // If the user already has an applicant ID and a workflow, return user
    if (userAccount.applicantId && userAccount.lastWorkflowRunId) {
      const applicant = await this.getApplicant(userAccount)
      userInvariant(applicant, 'user account not found', 404)
      return applicant
    }

    // Create Onfido applicant
    const requestBody: Omit<ApplicantOnfidoAPIRequest, 'id'> = {
      first_name: request.firstName,
      last_name: request.lastName,
      email: request.email,
      id_numbers: request.idNumbers,
    }
    if (request.dob) requestBody.dob = request.dob
    // If address object is passed in, it will require certain fields (i.e., postcode, country, etc.)
    if (request.address) {
      Object.assign(requestBody, {
        address: {
          postcode: request.address.postcode,
          country: request.address.country,
          line1: request.address.line1,
          line2: request.address.line2,
          line3: request.address.line3,
          street: request.address.street,
          sub_street: request.address.subStreet,
          state: request.address.state,
          town: request.address.town,
          flat_number: request.address.flatNumber,
          building_number: request.address.buildingNumber,
          building_name: request.address.buildingName,
        },
      })
    }

    // Create applicant
    const applicant = await this.onfido.createApplicant(requestBody)
    invariant(applicant?.externalId, 'applicant not created')

    // Create workflow run for applicant
    const workflow = await this.createWorkflowRun(applicant.externalId)
    invariant(workflow?.externalId, 'workflow run not created')

    // Add applicant ID to user record
    await UserAccountModel.query().patchAndFetchById(userAccount.id, {
      applicantId: applicant.externalId,
      lastWorkflowRunId: workflow.externalId,
      lastVerified: new Date().toISOString(),
    })

    return {
      ...applicant,
      workflow,
    }
  }

  private async createWorkflowRun(applicantId: string) {
    userInvariant(applicantId, 'applicant ID not provided', 404)

    const isVerificationEnabled = this.onfido.isEnabled
    userInvariant(isVerificationEnabled, 'verification not enabled', 404)

    const workflow = await this.onfido.createWorkflowRun(applicantId)
    invariant(workflow?.externalId, 'Workflow not created')

    return workflow
  }

  async generateNewWorkflow(userAccount: UserAccount) {
    const isVerificationEnabled = this.onfido.isEnabled
    userInvariant(isVerificationEnabled, 'verification not enabled', 404)
    userInvariant(userAccount.applicantId, 'applicant not found', 404)

    const workflow = await this.createWorkflowRun(userAccount.applicantId)
    invariant(workflow?.externalId, 'workflow run not created')

    await UserAccountModel.query().patchAndFetchById(userAccount.id, {
      lastWorkflowRunId: workflow.externalId,
    })

    return workflow
  }

  async getWorkflowDetails(workflowRunId: string) {
    userInvariant(workflowRunId, 'workflow run identifier not provided', 404)

    const isVerificationEnabled = this.onfido.isEnabled
    userInvariant(isVerificationEnabled, 'verification not enabled', 404)

    const workflow = await this.onfido.getWorkflowDetails(workflowRunId)
    invariant(workflow, 'Workflow not found')

    return workflow
  }

  async processOnfidoWebhook(webhook: string | Buffer, signature: string) {
    const isVerificationEnabled = this.onfido.isEnabled
    userInvariant(isVerificationEnabled, 'verification not enabled', 404)

    const notifications = await this.onfido.processWebhook(webhook, signature)

    if (!notifications || notifications.length === 0) {
      // Do not throw error
      this.logger.warn(
        { webhook },
        'No notifications received for Onfido webhook'
      )
      return
    }

    // Create notifications from returned list
    return await Promise.all(
      notifications.map(
        async (notification) =>
          await this.notifications.createNotification(notification)
      )
    )
  }

  async getUsersByVerificationStatus({
    page = 1,
    pageSize = 100,
    sortBy = UserSortField.CreatedAt,
    sortDirection = SortDirection.Ascending,
    verificationStatus = UserAccountStatus.ManualReview,
  }: UsersVerificationQuerystring): Promise<UserAccounts> {
    userInvariant(
      [
        UserSortField.Username,
        UserSortField.CreatedAt,
        UserSortField.Email,
      ].includes(sortBy),
      'sortBy must be one of username, email, or createdAt'
    )
    userInvariant(
      [SortDirection.Ascending, SortDirection.Descending].includes(
        sortDirection
      ),
      'sortDirection must be one of asc or desc'
    )

    const query = UserAccountModel.query()

    const { results: users, total } = await query
      .where({
        verificationStatus: verificationStatus,
      })
      .orderBy(sortBy, sortDirection)
      .page(page >= 1 ? page - 1 : page, pageSize)
    return { users, total }
  }

  async subscribeToMonitor(applicantId: string) {
    const isVerificationEnabled = this.onfido.isEnabled
    userInvariant(isVerificationEnabled, 'verification not enabled', 404)
    userInvariant(applicantId, 'applicant not found', 404)

    const subscription = await this.onfido.subscribeToMonitor({
      applicant_id: applicantId,
      report_name: 'watchlist_aml',
    })
    invariant(
      subscription?.externalId,
      `subscription to monitor not created for ${applicantId}`
    )

    // Update user record with KYC monitor ID
    await UserAccountModel.query().findOne({ applicantId }).patch({
      watchlistMonitorId: subscription.externalId,
    })

    return subscription
  }

  async startMonitorForApplicant() {
    await this.submitKycMonitorQueue.enqueue()
  }
  // #endregion kyc
}
