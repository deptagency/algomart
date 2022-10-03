import { Knex } from 'knex'

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable('CmsCacheCollectibleTemplates', (table) => {
    table.string('collectionId').nullable()
    table.string('setId').nullable()
  })
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable('CmsCacheCollectibleTemplates', (table) => {
    table.dropColumn('collectionId')
    table.dropColumn('setId')
  })
}
