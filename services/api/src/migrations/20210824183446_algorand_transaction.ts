import { Knex } from 'knex'

import { AlgorandTransactionStatus } from '@/models/algorand-transaction.model'

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('AlgorandTransaction', (table) => {
    table.uuid('id').primary()
    table.string('address', 52).unique().notNullable()
    table
      .text('status')
      .notNullable()
      .defaultTo(AlgorandTransactionStatus.Pending)
    table.uuid('groupId').references('id').inTable('AlgorandTransactionGroup')
    table.text('error')
    table.timestamp('createdAt').defaultTo(knex.fn.now()).notNullable()
    table.timestamp('updatedAt').defaultTo(knex.fn.now()).notNullable()
  })
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTable('AlgorandTransaction')
}
