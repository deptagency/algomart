import { Knex } from 'knex'

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable('UserAccountTransfer', (table) => {
    table.jsonb('circleTransferPayload').nullable()
  })
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable('UserAccountTransfer', (table) => {
    table.dropColumns('circleTransferPayload')
  })
}
