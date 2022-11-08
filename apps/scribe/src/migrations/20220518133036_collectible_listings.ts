import { Knex } from 'knex'

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('CollectibleListings', (table) => {
    table.uuid('id').primary()
    table
      .uuid('collectibleId')
      .references('id')
      .inTable('Collectible')
      .notNullable()
    table.integer('price').notNullable()
    table.text('type').notNullable()
    table.timestamp('expiresAt')
    table.timestamp('createdAt').defaultTo(knex.fn.now()).notNullable()
    table.timestamp('updatedAt').defaultTo(knex.fn.now()).notNullable()
  })
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTable('CollectibleListings')
}
