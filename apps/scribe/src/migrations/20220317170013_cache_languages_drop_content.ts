import { Knex } from 'knex'

export async function up(knex: Knex): Promise<void> {
  await knex.schema.dropTable('CmsCacheLanguages')
  await knex.schema.createTable('CmsCacheLanguages', (table) => {
    table.string('code').primary()
    table.string('label').notNullable()
    table.string('sort').unique().notNullable()
    table.timestamp('createdAt').defaultTo(knex.fn.now()).notNullable()
    table.timestamp('updatedAt').defaultTo(knex.fn.now()).notNullable()
  })
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTable('CmsCacheLanguages')
  await knex.schema.createTable('CmsCacheLanguages', (table) => {
    table.string('code').primary()
    table.jsonb('content').notNullable()
    table.timestamp('createdAt').defaultTo(knex.fn.now()).notNullable()
    table.timestamp('updatedAt').defaultTo(knex.fn.now()).notNullable()
  })
}
