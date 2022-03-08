import {
  AlgorandTransactionStatus,
  CreateUserAccountRequest,
  ExternalId,
  PublicAccount,
  SortDirection,
  UserAccounts,
  UserSortField,
  UsersQuerystring,
} from '@algomart/schemas'
import { UpdateUserAccount } from '@algomart/schemas'
import { Username } from '@algomart/schemas'
import { Transaction } from 'objection'

import AlgorandAdapter from '@/lib/algorand-adapter'
import { AlgorandAccountModel } from '@/models/algorand-account.model'
import { AlgorandTransactionModel } from '@/models/algorand-transaction.model'
import { UserAccountModel } from '@/models/user-account.model'
import { invariant, userInvariant } from '@/utils/invariant'
import { logger } from '@/utils/logger'

export default class AccountsService {
  logger = logger.child({ context: this.constructor.name })

  constructor(private readonly algorand: AlgorandAdapter) {}

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
    const result = this.algorand.generateAccount(request.passphrase)

    // 3. save account with encrypted mnemonic
    await UserAccountModel.query(trx).insertGraph({
      username: request.username,
      email: request.email,
      locale: request.locale,
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

    // send and wait for transaction to be confirmed
    await this.algorand.submitTransaction(signedTransactions)
    await this.algorand.waitForConfirmation(transactionIds[0])

    const transactions = [
      // funding transaction
      await AlgorandTransactionModel.query(trx).insert({
        address: transactionIds[0],
        status: AlgorandTransactionStatus.Confirmed,
      }),
      // non-participation transaction
      await AlgorandTransactionModel.query(trx).insert({
        address: transactionIds[1],
        status: AlgorandTransactionStatus.Pending,
      }),
    ]

    // update algorand account, its now funded
    await AlgorandAccountModel.query(trx)
      .patch({
        creationTransactionId: transactions[0].id,
      })
      .where({ id: userAccount.algorandAccountId })
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
      externalId: userAccount.externalId,
      username: userAccount.username,
      email: userAccount.email,
      locale: userAccount.locale,
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

    return this.algorand.isValidPassphrase(
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
