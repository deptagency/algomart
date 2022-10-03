import { Knex } from 'knex'

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable('Payment', (table) => {
    table
      .uuid('usdcDepositAlgorandTransactionId')
      .nullable()
      .references('id')
      .inTable('AlgorandTransaction')
      .index()
  })
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable('Payment', (table) => {
    table.dropColumn('usdcDepositAlgorandTransactionId')
  })
}
