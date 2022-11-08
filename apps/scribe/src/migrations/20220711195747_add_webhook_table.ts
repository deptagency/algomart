import { Knex } from 'knex'

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('Webhook', (table) => {
    table.text('id').primary()
    table.text('externalId').nullable().index()
    table.text('endpoint').notNullable()
    table.text('status').notNullable()
    table.jsonb('configurationPayload').nullable()
  })
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTable('Webhook')
}
