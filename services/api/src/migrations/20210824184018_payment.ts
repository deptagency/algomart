import { Knex } from 'knex'

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('Payment', (table) => {
    table.uuid('id').primary()
    table.uuid('paymentCardId').references('id').inTable('PaymentCard')
    table.uuid('payerId').notNullable().references('id').inTable('UserAccount')
    table.uuid('packId').references('id').inTable('Pack')
    table.timestamp('createdAt').defaultTo(knex.fn.now()).notNullable()
    table.timestamp('updatedAt').defaultTo(knex.fn.now()).notNullable()
  })
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTable('Payment')
}
