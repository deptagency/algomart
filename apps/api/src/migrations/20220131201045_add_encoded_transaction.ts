import { Knex } from 'knex'

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable('AlgorandTransaction', (table) => {
    table.text('encodedTransaction').nullable()
    table.text('signer').nullable()
  })
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable('AlgorandTransaction', (table) => {
    table.dropColumns('encodedTransaction', 'signer')
  })
}
