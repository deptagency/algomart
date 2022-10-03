import { Knex } from 'knex'

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable('Payment', (table) => {
    table.jsonb('retryPayload').nullable()
    table.text('retryIdempotencyKey').nullable()
  })
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable('Payment', (table) => {
    table.dropColumns('retryIdempotencyKey', 'retryPayload')
  })
}
