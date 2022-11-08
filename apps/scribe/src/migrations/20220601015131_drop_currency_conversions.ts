import { Knex } from 'knex'

export async function up(knex: Knex): Promise<void> {
  await knex.schema.dropTable('CurrencyConversions')
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.createTable('CurrencyConversions', (table) => {
    table.uuid('id').primary()
    table.string('sourceCurrency', 10).notNullable()
    table.string('targetCurrency', 10).notNullable()
    table.decimal('exchangeRate', null, null).notNullable()
    table.timestamp('createdAt').defaultTo(knex.fn.now()).notNullable()
    table.timestamp('updatedAt').defaultTo(knex.fn.now()).notNullable()
  })
}
