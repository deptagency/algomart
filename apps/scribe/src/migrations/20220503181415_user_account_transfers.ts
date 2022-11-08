import { Knex } from 'knex'

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable('UserAccount', (table) => {
    table.bigInteger('balance').defaultTo(0).notNullable()
    table.text('externalWalletId').nullable()

    table.index(['externalWalletId'], 'idx_externalWalletId')
  })

  await knex.schema.createTable('UserAccountTransfer', (table) => {
    table.uuid('id').primary()
    table
      .uuid('userAccountId')
      .references('id')
      .inTable('UserAccount')
      .notNullable()
    table.bigInteger('amount').notNullable()
    table.bigInteger('balance').nullable()
    table.uuid('externalId').unique().notNullable()
    table.text('entityType').notNullable()
    table.uuid('entityId').notNullable()
    table.timestamp('createdAt').defaultTo(knex.fn.now()).notNullable()
    table.timestamp('updatedAt').defaultTo(knex.fn.now()).notNullable()
    table.text('status').notNullable()
    table.text('error').nullable()

    table.index(['userAccountId'], 'idx_userAccountId')
    table.index(['createdAt'], 'idx_createdAt')
  })
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTable('UserAccountTransfer')

  await knex.schema.alterTable('UserAccount', (table) => {
    table.dropColumn('balance')
    table.dropColumn('externalWalletId')
  })
}
