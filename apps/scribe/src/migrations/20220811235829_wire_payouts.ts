import { Knex } from 'knex'

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('WirePayout', (table) => {
    // Internal
    table.uuid('id').primary()
    table
      .uuid('userId')
      .notNullable()
      .references('id')
      .inTable('UserAccount')
      .index()
    table
      .uuid('wireBankAccountId')
      .notNullable()
      .references('id')
      .inTable('WireBankAccount')
      .index()
    table.jsonb('createPayload').notNullable().unique()
    table.uuid('externalId').nullable().defaultTo(null)
    table.timestamp('createdAt').defaultTo(knex.fn.now()).notNullable()
    table.timestamp('updatedAt').defaultTo(knex.fn.now()).notNullable()

    // Circle
    table.text('trackingRef').nullable().defaultTo(null)
    table.text('externalRef').nullable().defaultTo(null)
    table.text('sourceWalletId').nullable().defaultTo(null)
    table.jsonb('destination').nullable().defaultTo(null)
    table.jsonb('amount').nullable().defaultTo(null)
    table.jsonb('fees').nullable().defaultTo(null)
    table.jsonb('riskEvaluation').nullable().defaultTo(null)
    table.jsonb('return').nullable().defaultTo(null)
    table.text('status').notNullable()
    table.text('error').nullable()
  })
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTable('WirePayout')
}
