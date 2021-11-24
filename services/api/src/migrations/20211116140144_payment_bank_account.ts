import { Knex } from 'knex'

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('PaymentBankAccount', (table) => {
    table.uuid('id').primary()
    table.uuid('externalId').notNullable().unique()
    table.integer('amount').notNullable()
    table.text('status').notNullable()
    table.uuid('ownerId').notNullable().references('id').inTable('UserAccount')
    table.timestamp('createdAt').defaultTo(knex.fn.now()).notNullable()
    table.timestamp('updatedAt').defaultTo(knex.fn.now()).notNullable()
  })
  await knex.schema.alterTable('Payment', (table) => {
    table.uuid('paymentBankId').references('id').inTable('PaymentCard')
  })
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTable('PaymentBankAccount')
  await knex.schema.alterTable('Payment', (table) => {
    table.dropColumn('paymentBankId')
  })
}
