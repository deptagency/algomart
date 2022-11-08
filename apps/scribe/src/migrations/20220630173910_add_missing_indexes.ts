import { Knex } from 'knex'

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable('Pack', (table) => {
    table.index('templateId')
  })

  await knex.schema.alterTable('UserAccount', (table) => {
    table.index('applicantId')
    table.index('lastVerified')
    table.index('createdAt')
  })

  await knex.raw(
    'UPDATE "CmsCachePackTemplates" SET "price" = 0 where "price" IS NULL'
  )

  await knex.schema.alterTable('CmsCachePackTemplates', (table) => {
    table.integer('price').notNullable().defaultTo(0).index().alter()
    table.index('type')
    table.index('auctionUntil')
    table.index('releasedAt')
  })

  await knex.schema.alterTable('Collectible', (table) => {
    table.index('templateId')
  })

  await knex.schema.alterTable('PaymentCard', (table) => {
    table.index('externalId')
  })

  await knex.schema.alterTable('CmsCacheCollectibleTemplates', (table) => {
    table.uuid('collectionId').alter()
    table.uuid('setId').alter()

    table.index('collectionId')
    table.index('setId')
    table.unique(['uniqueCode'])
  })

  await knex.schema.alterTable('UserAccountTransfer', (table) => {
    table.index(['entityType', 'entityId'])
    table.index('status')
  })

  await knex.schema.alterTable('CollectibleListings', (table) => {
    table.index('collectibleId')
    table.index('status')
    table.index('price')
    table.index('type')
  })
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable('Pack', (table) => {
    table.dropIndex('templateId')
  })

  await knex.schema.alterTable('UserAccount', (table) => {
    table.dropIndex('applicantId')
    table.dropIndex('lastVerified')
    table.dropIndex('createdAt')
  })

  await knex.schema.alterTable('CmsCachePackTemplates', (table) => {
    table.dropIndex('type')
    table.dropIndex('price')
    table.dropIndex('auctionUntil')
    table.dropIndex('releasedAt')
  })

  await knex.schema.alterTable('Collectible', (table) => {
    table.dropIndex('templateId')
  })

  await knex.schema.alterTable('PaymentCard', (table) => {
    table.dropIndex('externalId')
  })

  await knex.schema.alterTable('CmsCacheCollectibleTemplates', (table) => {
    table.string('collectionId').alter()
    table.string('setId').alter()

    table.dropIndex('collectionId')
    table.dropIndex('setId')
    table.dropUnique(['uniqueCode'])
  })

  await knex.schema.alterTable('UserAccountTransfer', (table) => {
    table.dropIndex(['entityType', 'entityId'])
    table.dropIndex('status')
  })

  await knex.schema.alterTable('CollectibleListings', (table) => {
    table.dropIndex('collectibleId')
    table.dropIndex('status')
    table.dropIndex('price')
    table.dropIndex('type')
  })
}
