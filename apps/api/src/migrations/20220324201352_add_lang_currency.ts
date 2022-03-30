import { Knex } from 'knex'

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable('UserAccount', (table) => {
    table.renameColumn('locale', 'language')
    table.string('currency').notNullable().defaultTo('USD')
  })

  await knex.schema.createTable('CmsCacheLanguages', (table) => {
    table.string('code').primary()
    table.string('name').notNullable()
    table.string('sort').unique().notNullable().defaultTo(1)
    table.timestamp('createdAt').defaultTo(knex.fn.now()).notNullable()
    table.timestamp('updatedAt').defaultTo(knex.fn.now()).notNullable()
  })

  await knex.schema.createTable('CurrencyConversions', (table) => {
    table.uuid('id').primary()
    table.string('sourceCurrency', 10).notNullable()
    table.string('targetCurrency', 10).notNullable()
    table.decimal('exchangeRate', null, null).notNullable()
    table.timestamp('createdAt').defaultTo(knex.fn.now()).notNullable()
    table.timestamp('updatedAt').defaultTo(knex.fn.now()).notNullable()
  })
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable('UserAccount', (table) => {
    table.renameColumn('language', 'locale')
    table.dropColumn('currency')
  })

  await knex.schema.dropTable('CmsCacheLanguages')
  await knex.schema.dropTable('CurrencyConversions')
}
