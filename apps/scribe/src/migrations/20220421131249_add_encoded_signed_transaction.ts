import { Knex } from 'knex'

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable('AlgorandTransaction', (table) => {
    table.text('encodedSignedTransaction').nullable()
    table.integer('order').nullable()
  })
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable('AlgorandTransaction', (table) => {
    table.dropColumns('encodedSignedTransaction', 'order')
  })
}
