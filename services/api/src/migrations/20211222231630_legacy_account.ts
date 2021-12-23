import { Knex } from 'knex'

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('LegacyAccount', (table) => {
    table.uuid('id').primary()
    table.text('legacyEmail').unique().notNullable()
    table.uuid('newAccountId').references('id').inTable('UserAccount')
    table.timestamp('createdAt').defaultTo(knex.fn.now()).notNullable()
    table.timestamp('updatedAt').defaultTo(knex.fn.now()).notNullable()
  })
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTable('LegacyAccount')
}
