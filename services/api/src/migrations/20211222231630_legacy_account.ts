import { Knex } from 'knex'

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('LegacyAccount', (table) => {
    table.uuid('id').primary()
    table.text('legacyEmail').unique().notNullable()
    table.uuid('newAccountId').references('id').inTable('UserAccount')
  })
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTable('LegacyAccount')
}
