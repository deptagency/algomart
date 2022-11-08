import { Knex } from 'knex'

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable('Payment', (table) => {
    table.text('itemType').nullable()
    table.text('itemId').nullable()
  })

  await knex.schema.alterTable('CollectibleListings', (table) => {
    table.timestamp('claimedAt').nullable()
  })
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable('Payment', (table) => {
    table.dropColumn('itemType')
    table.dropColumn('itemId')
  })

  await knex.schema.alterTable('CollectibleListings', (table) => {
    table.dropColumn('claimedAt')
  })
}
