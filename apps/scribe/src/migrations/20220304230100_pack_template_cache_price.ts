import { Knex } from 'knex'

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable('CmsCachePackTemplates', (table) => {
    table.integer('price')
  })
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable('CmsCachePackTemplates', (table) => {
    table.dropColumn('price')
  })
}
