import { Knex } from 'knex'

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('AlgorandAccount', (table) => {
    table.uuid('id').primary()
    table
      .uuid('creationTransactionId')
      .unique()
      .notNullable()
      .references('id')
      .inTable('AlgorandTransaction')
    table.string('address', 58).unique().notNullable()
    table.text('encryptedKey').notNullable()
    table.timestamp('createdAt').defaultTo(knex.fn.now()).notNullable()
    table.timestamp('updatedAt').defaultTo(knex.fn.now()).notNullable()
  })
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTable('AlgorandAccount')
}
