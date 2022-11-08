import { Knex } from 'knex'

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable('PaymentCard', (table) => {
    table.string('countryCode').nullable()
  })
  await knex.raw(
    'UPDATE "PaymentCard" SET "countryCode" = \'US\' where "countryCode" IS NULL'
  )
  await knex.schema.alterTable('PaymentCard', (table) => {
    table.string('countryCode').notNullable().alter()
  })
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable('PaymentCard', (table) => {
    table.dropColumn('countryCode')
  })
}
