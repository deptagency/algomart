import { Knex } from 'knex'

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('CollectibleAuction', (table) => {
    table.uuid('id').primary()
    table
      .uuid('collectibleId')
      .notNullable()
      .references('id')
      .inTable('Collectible')
    table
      .uuid('userAccountId')
      .notNullable()
      .references('id')
      .inTable('UserAccount')
    table.timestamp('createdAt').defaultTo(knex.fn.now()).notNullable()
    table.timestamp('updatedAt').defaultTo(knex.fn.now()).notNullable()
    table.integer('reservePrice').notNullable()
    table.timestamp('startAt').notNullable()
    table.timestamp('endAt').notNullable()
    table.text('status').notNullable()
    table.integer('appId').nullable().unique()
    table
      .uuid('transactionId')
      .notNullable()
      .references('id')
      .inTable('AlgorandTransaction')
  })

  await knex.schema.createTable('CollectibleAuctionBid', (table) => {
    table.uuid('id').primary()
    table
      .uuid('collectibleAuctionId')
      .notNullable()
      .references('id')
      .inTable('CollectibleAuction')
    table.integer('amount').notNullable()
    table
      .uuid('userAccountId')
      .notNullable()
      .references('id')
      .inTable('UserAccount')
    table.timestamp('createdAt').defaultTo(knex.fn.now()).notNullable()
    table.timestamp('updatedAt').defaultTo(knex.fn.now()).notNullable()
    table
      .uuid('transactionId')
      .nullable()
      .references('id')
      .inTable('AlgorandTransaction')
  })
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTable('CollectibleAuctionBid')
  await knex.schema.dropTable('CollectibleAuction')
}
