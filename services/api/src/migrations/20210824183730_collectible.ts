import { Knex } from 'knex'

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('Collectible', (table) => {
    table.uuid('id').primary()
    table
      .uuid('creationTransactionId')
      .unique()
      .references('id')
      .inTable('AlgorandTransaction')
    table
      .uuid('latestTransferTransactionId')
      .references('id')
      .inTable('AlgorandTransaction')
    table.uuid('templateId').notNullable()
    table.integer('edition').notNullable().defaultTo(1)
    table.integer('address')
    table.uuid('packId').references('id').inTable('Pack')
    table.uuid('ownerId').references('id').inTable('UserAccount')
    table.timestamp('claimedAt')
    table.timestamp('createdAt').defaultTo(knex.fn.now()).notNullable()
    table.timestamp('updatedAt').defaultTo(knex.fn.now()).notNullable()
  })
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTable('Collectible')
}
