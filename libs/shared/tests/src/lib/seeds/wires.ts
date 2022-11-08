import { WireBankAccountModel } from '@algomart/shared/models'
import { Knex } from 'knex'

import { wireBankAccountFactory } from './factories'

export async function createWireBankAccount(
  knex: Knex,
  factoryProps: Partial<WireBankAccountModel>
) {
  const wireBankAccount = wireBankAccountFactory.build(factoryProps)
  await knex('WireBankAccount').insert(wireBankAccount)
  return wireBankAccount
}
