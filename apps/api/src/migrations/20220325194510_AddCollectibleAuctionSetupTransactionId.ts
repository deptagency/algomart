import { Knex } from 'knex'

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable('CollectibleAuction', (table) => {
    table
      .uuid('setupTransactionId')
      .nullable()
      .references('id')
      .inTable('AlgorandTransaction')
  })
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable('CollectibleAuction', (table) => {
    table.dropColumn('setupTransactionId')
  })
}
