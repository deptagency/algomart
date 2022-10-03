import { AlgorandTransactionStatus, UserAccountStatus } from '@algomart/schemas'
import {
  AlgorandTransactionGroupModel,
  AlgorandTransactionModel,
  CollectibleModel,
  PackModel,
  UserAccountModel,
} from '@algomart/shared/models'
import {
  algorandTransactionFactory,
  algorandTransactionGroupFactory,
  createUnclaimedPack,
  createUserAccount,
} from '@algomart/shared/tests'
import { expect } from '@jest/globals'
import { Knex } from 'knex'

export async function setupUserAccountAndClaimedPack({
  knex,
  status = null,
  collectiblesCount = 4,
}: {
  knex: Knex
  status: AlgorandTransactionStatus
  collectiblesCount?: number
}) {
  const { userAccount } = await createUserAccount(knex, {
    email: 'one@test.local',
    externalId: 'one',
    username: 'one',
    balance: 1000,
    // null status prevents the algorand transactions from being seeded
    status,
    verificationStatus: UserAccountStatus.Unverified,
  })

  const { pack } = await createUnclaimedPack(knex, { collectiblesCount })

  // claim the pack
  const claimedAt = new Date().toISOString()
  await PackModel.query().where('id', pack.id).patch({
    claimedAt,
    updatedAt: claimedAt,
    ownerId: userAccount.id,
  })

  const fullUserAccount = await UserAccountModel.query()
    .findOne({ id: userAccount.id })
    .withGraphFetched(
      'algorandAccount.creationTransaction.group.transactions(orderAscByOrderField)'
    )

  const fullPack = await PackModel.query()
    .findOne({ id: pack.id })
    .withGraphFetched('template')

  return { userAccount: fullUserAccount, pack: fullPack }
}

export async function getUserAccountAndTransactions(id) {
  return await UserAccountModel.query()
    .findOne({ id })
    .withGraphFetched(
      'algorandAccount.creationTransaction.group.transactions(orderAscByOrderField)'
    )
}

export function expectTransactionsToBeConfirmed(transactions) {
  const allTransactionsAreConfirmed = transactions.every(
    (trx) => trx.status === AlgorandTransactionStatus.Confirmed
  )
  expect(allTransactionsAreConfirmed).toBe(true)
}

export function expectTransactionAddressesToMatch(
  transactions,
  transactionAddresses
) {
  expect(transactions.map((trx) => trx.address)).toEqual(transactionAddresses)
}

export async function expectAllTransactionsCountToBe(n) {
  const transactionCountReply: unknown =
    await AlgorandTransactionModel.query().count()

  expect(Number(transactionCountReply[0].count)).toBe(n)
}

export async function expectAllTransactionGroupsCountToBe(n) {
  // at this point no other groups should exist
  const transactionGroupsCountReply: unknown =
    await AlgorandTransactionGroupModel.query().count()

  expect(Number(transactionGroupsCountReply[0].count)).toBe(n)
}

export function expectTransactionsToBeFailed(
  transactions: AlgorandTransactionModel[]
) {
  // all transactions should be recorded as FAILED
  const allTransactionsAreFailed = transactions.every(
    (trx) => trx.status === AlgorandTransactionStatus.Failed
  )
  expect(allTransactionsAreFailed).toBe(true)
}

export function expectTransactionsToHaveError(
  transactions: AlgorandTransactionModel[],
  errorMessage: string
) {
  // all transactions should have the error message
  const allTransactionsHaveError = transactions.every(
    (trx) => trx.error === errorMessage
  )
  expect(allTransactionsHaveError).toBe(true)
}

export async function addCreationTransactionsToPackCollectibles(
  knex,
  { packId, addresses = null, status }
) {
  const collectibles = await CollectibleModel.query().where({ packId })
  const transactionGroup = algorandTransactionGroupFactory.build()
  let transactions = algorandTransactionFactory.buildList(collectibles.length, {
    status,
    groupId: transactionGroup.id,
  })
  if (addresses) {
    transactions = transactions.map((transaction, index) => ({
      ...transaction,
      address: addresses[index],
    }))
  }

  await knex('AlgorandTransactionGroup').insert(transactionGroup)
  await knex('AlgorandTransaction').insert(transactions)
  await Promise.all(
    transactions.map((trx, index) =>
      CollectibleModel.query()
        .where({ id: collectibles[index].id })
        .patch({ creationTransactionId: trx.id })
    )
  )
}

export async function expectTransactionAddressesNotToExist(
  transactionAddresses
) {
  const matches = await AlgorandTransactionModel.query().whereIn(
    'address',
    transactionAddresses
  )
  expect(matches.length).toBe(0)
}
