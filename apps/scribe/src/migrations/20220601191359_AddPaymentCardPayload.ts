import { Knex } from 'knex'

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable('PaymentCard', (table) => {
    table.jsonb('payload').nullable()
    table.text('idempotencyKey').nullable()
  })
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable('PaymentCard', (table) => {
    table.dropColumns('payload', 'idempotencyKey')
  })
}
