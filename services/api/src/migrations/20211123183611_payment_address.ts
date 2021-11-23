import { Knex } from 'knex'

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('PaymentAddress', (table) => {
    table.uuid('id').primary()
    table.uuid('externalId').notNullable().unique()
    table.text('status').nullable()
    table.uuid('packId').notNullable().references('id').inTable('Pack')
    table.uuid('ownerId').notNullable().references('id').inTable('UserAccount')
    table.timestamp('createdAt').defaultTo(knex.fn.now()).notNullable()
    table.timestamp('updatedAt').defaultTo(knex.fn.now()).notNullable()
  })
  await knex.schema.alterTable('Payment', (table) => {
    table.uuid('addressId').references('id').inTable('PaymentAddress')
  })
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTable('PaymentAddress')
  await knex.schema.alterTable('Payment', (table) => {
    table.dropColumn('addressId')
  })
}
