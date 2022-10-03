import { Knex } from 'knex'

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable('CollectibleListings', (table) => {
    table
      .uuid('sellerId')
      .nullable()
      .references('id')
      .inTable('UserAccount')
      .index()

    table
      .uuid('buyerId')
      .nullable()
      .references('id')
      .inTable('UserAccount')
      .index()

    table.text('status').nullable()

    table.timestamp('purchasedAt').nullable()
  })
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable('CollectibleListings', (table) => {
    table.dropColumns('sellerId', 'buyerId', 'status', 'purchasedAt')
  })
}
