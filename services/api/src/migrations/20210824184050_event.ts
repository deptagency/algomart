import { Knex } from 'knex'

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('Event', (table) => {
    table.uuid('id').primary()
    table.text('action').notNullable()
    table.text('entityType').notNullable()
    table.uuid('entityId').notNullable()
    table.uuid('userAccountId').references('id').inTable('UserAccount')
    table.timestamp('createdAt').defaultTo(knex.fn.now()).notNullable()
    table.timestamp('updatedAt').defaultTo(knex.fn.now()).notNullable()
  })
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTable('Event')
}
