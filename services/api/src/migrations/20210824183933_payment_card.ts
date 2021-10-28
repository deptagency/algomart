import { Knex } from 'knex'

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('PaymentCard', (table) => {
    table.uuid('id').primary()
    table.string('network').notNullable()
    table.string('lastFour').notNullable()
    table.string('expirationMonth').notNullable()
    table.string('expirationYear').notNullable()
    table.uuid('ownerId').notNullable().references('id').inTable('UserAccount')
    table.timestamp('createdAt').defaultTo(knex.fn.now()).notNullable()
    table.timestamp('updatedAt').defaultTo(knex.fn.now()).notNullable()
  })
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTable('PaymentCard')
}
