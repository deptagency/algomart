import { Knex } from 'knex'

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable('Payment', (table) => {
    table.text('errorDetails').nullable()
  })

  await knex.schema.alterTable('PaymentCard', (table) => {
    table.text('errorDetails').nullable()
  })

  await knex.schema.alterTable('UserAccountTransfer', (table) => {
    table.text('errorDetails').nullable()
  })
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable('Payment', (table) => {
    table.dropColumn('errorDetails')
  })

  await knex.schema.alterTable('PaymentCard', (table) => {
    table.dropColumn('errorDetails')
  })

  await knex.schema.alterTable('UserAccountTransfer', (table) => {
    table.dropColumn('errorDetails')
  })
}
