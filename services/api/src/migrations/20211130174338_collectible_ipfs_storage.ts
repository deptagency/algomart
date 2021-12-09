import { Knex } from 'knex'

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable('Collectible', (table) => {
    table.text('assetMetadataHash').nullable()
    table.text('assetUrl').nullable()
    table.text('ipfsStatus').nullable()
  })
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable('Collectible', (table) => {
    table.dropColumn('assetMetadataHash')
    table.dropColumn('assetUrl')
    table.dropColumn('ipfsStatus')
  })
}
