import { Knex } from 'knex'

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable('UserAccount', (table) => {
    table.string('verificationId').nullable().unique()
  })
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable('UserAccount', (table) => {
    table.dropColumn('verificationId')
  })
}
