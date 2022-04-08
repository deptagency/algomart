import { Knex } from 'knex'

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable('AlgorandAccount', (table) => {
    table.uuid('creationTransactionId').nullable().alter()
  })
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable('AlgorandAccount', (table) => {
    // WARNING! Cannot undo this if there are NULL values in the column
    table.uuid('creationTransactionId').notNullable().alter()
  })
}
