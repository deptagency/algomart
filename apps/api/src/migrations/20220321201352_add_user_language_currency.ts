import { Knex } from 'knex'

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable('UserAccount', (table) => {
    table.renameColumn('locale', 'language')
    table.string('currency').notNullable().defaultTo('USD')
  })
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable('UserAccount', (table) => {
    table.renameColumn('language', 'locale')
    table.dropColumn('currency')
  })
}
