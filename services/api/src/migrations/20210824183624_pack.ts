import { Knex } from 'knex'

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('Pack', (table) => {
    table.uuid('id').primary()
    table.uuid('templateId').notNullable()
    table.uuid('ownerId').references('id').inTable('UserAccount')
    table.text('redeemCode').unique()
    table.timestamp('claimedAt')
    table.timestamp('createdAt').defaultTo(knex.fn.now()).notNullable()
    table.timestamp('updatedAt').defaultTo(knex.fn.now()).notNullable()
  })
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTable('Pack')
}
