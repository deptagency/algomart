import { Knex } from 'knex'

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable('Payment', (table) => {
    table.text('action')
  })
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable('Payment', (table) => {
    table.dropColumn('action')
  })
}
