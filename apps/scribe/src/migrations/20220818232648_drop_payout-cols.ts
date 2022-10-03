import { Knex } from 'knex'

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable('Payout', (table) => {
    table.dropColumn('payoutType')
    table.dropColumn('externalBankId')
  })
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable('Payout', (table) => {
    table.text('payoutType').notNullable()
    table.string('externalBankId').nullable()
  })
}
