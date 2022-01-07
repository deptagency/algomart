import { Knex } from 'knex'

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable('Payment', (table) => {
    table.text('destinationAddress').nullable()
    table.uuid('transferId').nullable()
  })
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable('Payment', (table) => {
    table.dropColumn('destinationAddress')
    table.dropColumn('transferId')
  })
}
