import { Knex } from 'knex'

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('UserAccount', (table) => {
    table.uuid('id').primary()
    table.string('username', 20).notNullable().unique()
    table
      .uuid('algorandAccountId')
      .notNullable()
      .unique()
      .references('id')
      .inTable('AlgorandAccount')
    table.string('externalId').notNullable().unique()
    table.timestamp('createdAt').defaultTo(knex.fn.now()).notNullable()
    table.timestamp('updatedAt').defaultTo(knex.fn.now()).notNullable()
  })
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTable('UserAccount')
}
