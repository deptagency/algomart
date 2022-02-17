import { Knex } from 'knex'

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('CmsCachePackTemplates', (table) => {
    table.uuid('id').primary()
    table.string('slug').notNullable()
    table.string('type').notNullable()
    table.dateTime('releasedAt')
    table.jsonb('content').notNullable()
  })

  await knex.schema.createTable('CmsCacheCollectibleTemplates', (table) => {
    table.uuid('id').primary()
    table.string('slug').notNullable()
    table.jsonb('content').defaultTo('{}').notNullable()
  })

  await knex.schema.createTable('CmsCacheCollections', (table) => {
    table.uuid('id').primary()
    table.string('slug').notNullable()
    table.jsonb('content').defaultTo('{}').notNullable()
  })

  await knex.schema.createTable('CmsCacheSets', (table) => {
    table.uuid('id').primary()
    table.string('slug').notNullable()
    table.jsonb('content').defaultTo('{}').notNullable()
  })

  await knex.schema.createTable('CmsCachePages', (table) => {
    table.uuid('id').primary()
    table.string('slug').notNullable()
    table.jsonb('content').defaultTo('{}').notNullable()
  })

  await knex.schema.createTable('CmsCacheFaqs', (table) => {
    table.uuid('id').primary()
    table.string('slug').notNullable()
    table.jsonb('content').defaultTo('{}').notNullable()
  })

  await knex.schema.createTable('CmsCacheHomepage', (table) => {
    table.uuid('id').primary()
    table.jsonb('content').defaultTo('{}').notNullable()
  })

  await knex.schema.createTable('CmsCacheLanguages', (table) => {
    table.uuid('id').primary()
    table.string('slug').notNullable()
    table.jsonb('content').defaultTo('{}').notNullable()
  })
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTable('CmsCachePackTemplates')
  await knex.schema.dropTable('CmsCacheCollectibleTemplates')
  await knex.schema.dropTable('CmsCacheCollections')
  await knex.schema.dropTable('CmsCacheSets')
  await knex.schema.dropTable('CmsCachePages')
  await knex.schema.dropTable('CmsCacheFaqs')
  await knex.schema.dropTable('CmsCacheHomepage')
  await knex.schema.dropTable('CmsCacheLanguages')
}
