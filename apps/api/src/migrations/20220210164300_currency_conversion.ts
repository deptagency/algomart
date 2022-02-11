import { Knex } from 'knex'

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('CurrencyConversions', (table) => {
    table.primary(['sourceCurrency', 'targetCurrency'])
    table.string('sourceCurrency', 4).notNullable()
    table.string('targetCurrency', 4).notNullable()
    table.decimal('exchangeRate', 10, 4).notNullable()
    table.timestamp('createdAt').defaultTo(knex.fn.now()).notNullable()
    table.timestamp('updatedAt').defaultTo(knex.fn.now()).notNullable()
  })
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTable('CurrencyConversions')
}
