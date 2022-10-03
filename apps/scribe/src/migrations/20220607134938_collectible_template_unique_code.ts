import { Knex } from 'knex'

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable('CmsCacheCollectibleTemplates', (table) => {
    table.string('uniqueCode').nullable()
  })
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable('CmsCacheCollectibleTemplates', (table) => {
    table.dropColumn('uniqueCode')
  })
}
