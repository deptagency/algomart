import { Knex } from 'knex'

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable('Payment', (table) => {
    table.dropColumn('paymentBankId')
  })
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable('Payment', (table) => {
    table.uuid('paymentBankId').references('id').inTable('PaymentBankAccount')
    table.index('paymentBankId')
  })
}
