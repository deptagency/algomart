import { Knex } from 'knex'

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable('UserAccount', (table) => {
    table.boolean('showProfile').defaultTo(false)
  })
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable('UserAccount', (table) => {
    table.dropColumn('showProfile')
  })
}
