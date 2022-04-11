import { Knex } from 'knex'

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('CollectibleOwnership', (table) => {
    table.uuid('id').primary()
    table
      .uuid('collectibleId')
      .notNullable()
      .references('id')
      .inTable('Collectible')
    table.uuid('ownerId').notNullable().references('id').inTable('UserAccount')
    table.timestamp('createdAt').defaultTo(knex.fn.now()).notNullable()
    table.timestamp('updatedAt').defaultTo(knex.fn.now()).notNullable()
  })
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTable('CollectibleOwnership')
}
