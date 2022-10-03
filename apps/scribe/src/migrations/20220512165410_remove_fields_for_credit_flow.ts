import { Knex } from 'knex'

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable('Payment', (table) => {
    table.dropIndex('packId')
    table.dropColumn('packId')
  })
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable('Payment', (table) => {
    table.uuid('packId').references('id').inTable('Pack')
    table.index('packId')
  })
}
