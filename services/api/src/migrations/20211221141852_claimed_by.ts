import { Knex } from 'knex'

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable('Pack', (table) => {
    table.uuid('claimedById').references('id').inTable('UserAccount')
  })
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable('Pack', (table) => {
    table.dropColumn('claimedById')
  })
}
