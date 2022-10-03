import { Knex } from 'knex'

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable('Event', (table) => {
    table.dropIndex('userAccountId')
    table.dropColumn('userAccountId')
    table.jsonb('payload').nullable()
  })
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable('Event', (table) => {
    table.dropColumn('payload')
    table.uuid('userAccountId').references('id').inTable('UserAccount').index()
  })
}
