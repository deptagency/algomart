import { Knex } from 'knex'

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable('WireBankAccount', (table) => {
    table.jsonb('riskEvaluation').nullable().defaultTo(null)
  })
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable('WireBankAccount', (table) => {
    table.dropColumn('riskEvaluation')
  })
}
