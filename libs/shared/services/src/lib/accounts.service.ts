import pino from 'pino'
import {
  AlgorandTransactionStatus,
  CreateUserAccountRequest,
  EventAction,
  EventEntityType,
  ExternalId,
  PublicAccount,
  SortDirection,
  UserAccounts,
  UserSortField,
  UsersQuerystring,
} from '@algomart/schemas'
import { UpdateUserAccount } from '@algomart/schemas'
import { Username } from '@algomart/schemas'
import { AlgorandAdapter } from '@algomart/shared/adapters'
import {
  AlgorandAccountModel,
  AlgorandTransactionGroupModel,
  AlgorandTransactionModel,
  EventModel,
  UserAccountModel,
} from '@algomart/shared/models'
import { invariant, userInvariant } from '@algomart/shared/utils'
import { Transaction } from 'objection'
import { encodeRawSignedTransaction } from '@algomart/shared/algorand'

export class AccountsService {
  logger: pino.Logger<unknown>

  constructor(
    private readonly algorand: AlgorandAdapter,
    logger: pino.Logger<unknown>
  ) {
    this.logger = logger.child({ context: this.constructor.name })
  }

  async create(request: CreateUserAccountRequest, trx?: Transaction) {
    // 1. Check for a username or externalId collision
    const existing = await UserAccountModel.query(trx)
      .where({
        username: request.username,
      })
      .orWhere({ externalId: request.externalId })
      .first()
    userInvariant(!existing, 'username or externalId already exists', 400)

    // 2. generate algorand account (i.e. wallet)
    const result = await this.algorand.generateAccount(request.passphrase)

    // 3. save account with encrypted mnemonic
    await UserAccountModel.query(trx).insertGraph({
      username: request.username,
      currency: request.currency,
      email: request.email,
      language: request.language,
      externalId: request.externalId,
      algorandAccount: {
        address: result.address,
        encryptedKey: result.encryptedMnemonic,
      },
    })

    // 4. return "public" user account
    const userAccount = await UserAccountModel.query(trx)
      .findOne({
        username: request.username,
      })
      .withGraphJoined('algorandAccount.creationTransaction')

    return this.mapPublicAccount(userAccount)
  }

  async initializeAccount(
    userId: string,
    passphrase: string,
    trx?: Transaction
  ) {
    const userAccount = await UserAccountModel.query(trx)
      .findById(userId)
      .withGraphJoined('algorandAccount')

    userInvariant(userAccount, 'user account not found', 404)
    invariant(
      userAccount.algorandAccount,
      `user account ${userId} missing algorand account`
    )
    userInvariant(
      userAccount.algorandAccount.creationTransactionId === null,
      `user account ${userId} already initialized`
    )

    // generate transactions to fund the account and opt-out of staking rewards
    const { signedTransactions, transactionIds } =
      await this.algorand.initialFundTransactions(
        userAccount.algorandAccount.encryptedKey,
        passphrase
      )

    // store signed transactions for later sending
    const group = await AlgorandTransactionGroupModel.query(trx).insert({})
    const transactions = await AlgorandTransactionModel.query(trx).insert(
      transactionIds.map((id, index) => ({
        address: id,
        status: AlgorandTransactionStatus.Signed,
        groupId: group.id,
        encodedSignedTransaction: encodeRawSignedTransaction(
          signedTransactions[index]
        ),
        order: index,
      }))
    )

    // update algorand account
    await AlgorandAccountModel.query(trx)
      .patch({
        creationTransactionId: transactions[0].id,
      })
      .where({ id: userAccount.algorandAccountId })

    // add events
    await EventModel.query(trx).insert([
      {
        action: EventAction.Create,
        entityType: EventEntityType.AlgorandTransactionGroup,
        entityId: group.id,
      },
      {
        action: EventAction.Create,
        entityType: EventEntityType.AlgorandTransaction,
        entityId: transactions[0].id,
      },
      {
        action: EventAction.Create,
        entityType: EventEntityType.AlgorandTransaction,
        entityId: transactions[1].id,
      },
      {
        action: EventAction.Update,
        entityType: EventEntityType.AlgorandAccount,
        entityId: userAccount.algorandAccountId,
      },
    ])
  }

  async updateAccount(
    {
      email,
      externalId,
      showProfile,
      username,
    }: UpdateUserAccount & ExternalId,
    trx?: Transaction
  ) {
    const result = await UserAccountModel.query(trx)
      .where({ externalId })
      .patch({
        email,
        showProfile,
        username,
      })
    userInvariant(result === 1, 'user account not found', 404)
  }

  private mapPublicAccount(
    userAccount: UserAccountModel | null | undefined
  ): PublicAccount {
    userInvariant(userAccount, 'user account not found', 404)

    invariant(userAccount.algorandAccount, 'algorand account not loaded')

    return {
      address: userAccount.algorandAccount.address,
      currency: userAccount.currency,
      externalId: userAccount.externalId,
      username: userAccount.username,
      email: userAccount.email,
      language: userAccount.language,
      status: userAccount.algorandAccount.creationTransaction
        ? userAccount.algorandAccount.creationTransaction.status
        : undefined,
      showProfile: userAccount.showProfile,
    }
  }

  async getByExternalId(request: ExternalId) {
    const userAccount = await UserAccountModel.query()
      .findOne({
        externalId: request.externalId,
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

  async getUsers({
    page = 1,
    pageSize = 10,
    search = '',
    sortBy = UserSortField.CreatedAt,
    sortDirection = SortDirection.Ascending,
  }: UsersQuerystring): Promise<UserAccounts> {
    userInvariant(page > 0, 'page must be greater than 0')
    userInvariant(
      pageSize > 0 || pageSize === -1,
      'pageSize must be greater than 0'
    )
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

    // Find payer
    if (search?.length > 0) {
      const ilikeSearch = `%${search}%`
      query
        .where('email', 'ilike', ilikeSearch)
        .orWhere('username', 'ilike', ilikeSearch)
    }

    const { results: users, total } = await query
      .orderBy(sortBy, sortDirection)
      .page(page >= 1 ? page - 1 : page, pageSize)

    return { users, total }
  }

  async verifyPassphraseFor(externalId: string, passphrase: string) {
    const userAccount = await UserAccountModel.query()
      .findOne({ externalId })
      .withGraphJoined('algorandAccount')

    userInvariant(userAccount, 'user account not found', 404)

    if (!userAccount.algorandAccount?.encryptedKey) {
      return false
    }

    return await this.algorand.isValidPassphrase(
      userAccount.algorandAccount.encryptedKey,
      passphrase
    )
  }

  async verifyUsername(username: string) {
    const userId = await UserAccountModel.query()
      .findOne({ username })
      .select('id')
    return Boolean(userId)
  }

  async removeUser(request: ExternalId) {
    const user = await UserAccountModel.query().findOne({
      externalId: request.externalId,
    })
    if (user) {
      await UserAccountModel.query().deleteById(user.id)
      return true
    }
    return false
  }
}
