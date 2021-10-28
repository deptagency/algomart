import { Knex } from 'knex'

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable('PaymentCard', (table) => {
    table.uuid('externalId').notNullable().unique()
  })
  await knex.schema.alterTable('Payment', (table) => {
    table.uuid('externalId').notNullable().unique()
  })
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable('PaymentCard', (table) => {
    table.dropColumn('externalId')
  })
  await knex.schema.alterTable('Payment', (table) => {
    table.dropColumn('externalId')
  })
}
