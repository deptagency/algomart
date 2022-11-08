import {
  AlgorandTransactionStatus,
  UserAccount,
  UserAccountStatus,
} from '@algomart/schemas'
import { Knex } from 'knex'

import {
  algorandAccountFactory,
  algorandTransactionFactory,
  algorandTransactionGroupFactory,
  userAccountFactory,
} from './factories'

export async function createUserAccount(
  knex: Knex,
  {
    email,
    externalId,
    username,
    status = AlgorandTransactionStatus.Pending,
    balance = 0,
    applicantId = null,
    verificationStatus = UserAccountStatus.Unverified,
  }: Pick<
    UserAccount,
    | 'balance'
    | 'email'
    | 'username'
    | 'externalId'
    | 'applicantId'
    | 'verificationStatus'
  > & {
    status?: AlgorandTransactionStatus
  }
) {
  let algorandAccountTransactionGroup = null
  let algorandAccountTransaction = null
  if (status) {
    algorandAccountTransactionGroup = algorandTransactionGroupFactory.build()
    algorandAccountTransaction = algorandTransactionFactory.build({
      status,
      groupId: algorandAccountTransactionGroup.id,
    })
  }

  const algorandAccount = algorandAccountFactory.build({
    creationTransactionId: algorandAccountTransaction?.id,
  })
  const userAccount = userAccountFactory.build({
    algorandAccountId: algorandAccount.id,
    email,
    externalId,
    username,
    balance,
    applicantId,
    lastWorkflowRunId: applicantId ? 'fake-workflow-run-id' : null,
    verificationStatus,
    watchlistMonitorId: applicantId ? 'fake-watchlist-monitor-id' : null,
  })

  if (algorandAccountTransaction) {
    await knex('AlgorandTransactionGroup').insert(
      algorandAccountTransactionGroup
    )
    await knex('AlgorandTransaction').insert(algorandAccountTransaction)
  }
  await knex('AlgorandAccount').insert(algorandAccount)
  await knex('UserAccount').insert(userAccount)

  // Add as convenience, this is always available per normal Firebase JWT auth flow
  userAccount.algorandAccount = algorandAccount

  return {
    algorandAccount,
    userAccount,
    algorandAccountTransaction,
  }
}
