import { Knex } from 'knex'

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('CmsCacheApplication', (table) => {
    table.uuid('id').primary()
    table.jsonb('content').notNullable()
    table.timestamp('createdAt').defaultTo(knex.fn.now()).notNullable()
    table.timestamp('updatedAt').defaultTo(knex.fn.now()).notNullable()
  })

  await knex.schema.createTable('CmsCachePackTemplates', (table) => {
    table.uuid('id').primary()
    table.string('slug').notNullable().unique()
    table.string('type').notNullable()
    table.dateTime('releasedAt')
    table.dateTime('auctionUntil')
    table.jsonb('content').notNullable()
    table.timestamp('createdAt').defaultTo(knex.fn.now()).notNullable()
    table.timestamp('updatedAt').defaultTo(knex.fn.now()).notNullable()
  })

  await knex.schema.createTable('CmsCacheCollectibleTemplates', (table) => {
    table.uuid('id').primary()
    table.jsonb('content').notNullable()
    table.timestamp('createdAt').defaultTo(knex.fn.now()).notNullable()
    table.timestamp('updatedAt').defaultTo(knex.fn.now()).notNullable()
  })

  await knex.schema.createTable('CmsCacheCollections', (table) => {
    table.uuid('id').primary()
    table.string('slug').notNullable().unique()
    table.jsonb('content').notNullable()
    table.timestamp('createdAt').defaultTo(knex.fn.now()).notNullable()
    table.timestamp('updatedAt').defaultTo(knex.fn.now()).notNullable()
  })

  await knex.schema.createTable('CmsCacheSets', (table) => {
    table.uuid('id').primary()
    table.string('slug').notNullable().unique()
    table.jsonb('content').notNullable()
    table.timestamp('createdAt').defaultTo(knex.fn.now()).notNullable()
    table.timestamp('updatedAt').defaultTo(knex.fn.now()).notNullable()
  })

  await knex.schema.createTable('CmsCacheHomepage', (table) => {
    table.uuid('id').primary()
    table.jsonb('content').notNullable()
    table.timestamp('createdAt').defaultTo(knex.fn.now()).notNullable()
    table.timestamp('updatedAt').defaultTo(knex.fn.now()).notNullable()
  })
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTable('CmsCacheApplication')
  await knex.schema.dropTable('CmsCachePackTemplates')
  await knex.schema.dropTable('CmsCacheCollectibleTemplates')
  await knex.schema.dropTable('CmsCacheCollections')
  await knex.schema.dropTable('CmsCacheSets')
  await knex.schema.dropTable('CmsCacheHomepage')
}
