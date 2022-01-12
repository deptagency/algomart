import { Knex } from 'knex'

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable('PaymentCard', (table) => {
    table.text('status').nullable()
    table.text('error').nullable()
  })
  await knex.schema.alterTable('Payment', (table) => {
    table.text('status').nullable()
    table.text('error').nullable()
  })
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable('PaymentCard', (table) => {
    table.dropColumn('status')
    table.dropColumn('error')
  })
  await knex.schema.alterTable('Payment', (table) => {
    table.dropColumn('status')
    table.dropColumn('error')
  })
}
