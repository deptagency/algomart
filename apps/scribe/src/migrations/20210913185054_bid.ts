import { Knex } from 'knex'

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('Bid', (table) => {
    table.uuid('id').primary()
    table
      .uuid('userAccountId')
      .references('id')
      .inTable('UserAccount')
      .notNullable()
    table.uuid('packId').references('id').inTable('Pack').notNullable()
    table.integer('amount').notNullable()
    table.timestamp('createdAt').defaultTo(knex.fn.now()).notNullable()
    table.timestamp('updatedAt').defaultTo(knex.fn.now()).notNullable()
  })

  await knex.schema.alterTable('Pack', (table) => {
    table.uuid('activeBidId').references('id').inTable('Bid').nullable()
  })
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable('Pack', (table) => {
    table.dropColumn('activeBidId')
  })

  await knex.schema.dropTable('Bid')
}
