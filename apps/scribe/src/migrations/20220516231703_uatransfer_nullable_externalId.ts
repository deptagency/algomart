import { Knex } from 'knex'

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable('UserAccountTransfer', (table) => {
    table.uuid('externalId').nullable().alter()
  })
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable('UserAccountTransfer', (table) => {
    table.uuid('externalId').notNullable().alter()
  })
}
