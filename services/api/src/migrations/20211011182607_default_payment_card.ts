import { Knex } from 'knex'

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable('PaymentCard', (table) => {
    table.boolean('default').defaultTo(false)
  })
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable('PaymentCard', (table) => {
    table.dropColumn('default')
  })
}
