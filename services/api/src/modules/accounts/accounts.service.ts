import {
  AlgorandTransactionStatus,
  CreateUserAccountRequest,
  ExternalId,
  PublicAccount,
} from '@algomart/schemas'
import { UpdateUserAccount } from '@algomart/schemas'
import { Username } from '@algomart/schemas'
import { Transaction } from 'objection'

import AlgorandAdapter from '@/lib/algorand-adapter'
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

    // 2. create and fund algorand account (i.e. wallet) with min balance (0.1 ALGO)
    const result = await this.algorand.createAccount(request.passphrase)
    await this.algorand.submitTransaction(result.signedTransactions)
    if (request.waitForConfirmation) {
      await this.algorand.waitForConfirmation(result.transactionIds[0])
    }

    // 3. create new user account with reference to algorand account
    // NOTE: cannot use batch insert as SQLite does not support it
    const transactions = [
      // funding transaction
      await AlgorandTransactionModel.query(trx).insert({
        address: result.transactionIds[0],
        status: request.waitForConfirmation
          ? AlgorandTransactionStatus.Confirmed
          : AlgorandTransactionStatus.Pending,
      }),
      // non-participation transaction
      await AlgorandTransactionModel.query(trx).insert({
        address: result.transactionIds[1],
        status: AlgorandTransactionStatus.Pending,
      }),
    ]

    await UserAccountModel.query(trx).insertGraph({
      username: request.username,
      email: request.email,
      locale: request.locale,
      externalId: request.externalId,
      algorandAccount: {
        address: result.address,
        encryptedKey: result.encryptedMnemonic,
        creationTransactionId: transactions[0].id,
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
    invariant(
      userAccount.algorandAccount.creationTransaction,
      `algorand account's creation transaction not loaded`
    )

    return {
      address: userAccount.algorandAccount.address,
      externalId: userAccount.externalId,
      username: userAccount.username,
      email: userAccount.email,
      locale: userAccount.locale,
      status: userAccount.algorandAccount.creationTransaction.status,
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
}
