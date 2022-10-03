import { Knex } from 'knex'

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('WireBankAccount', (table) => {
    table.uuid('id').primary()
    // note: fields provided by circle will initially be null because we record
    // the row in pending status before we send the creation request to circle
    table.uuid('externalId').nullable().defaultTo(null)
    table.uuid('fingerprint').nullable().defaultTo(null)
    table.text('trackingRef').nullable().defaultTo(null)
    table.text('description').nullable().defaultTo(null)
    table.text('idempotencyKey').notNullable().unique()
    table.text('status').notNullable()
    table.boolean('default').notNullable().defaultTo(false)
    table.boolean('isSaved').notNullable().defaultTo(false)
    table.text('accountNumber').nullable().defaultTo(null)
    table.text('routingNumber').nullable().defaultTo(null)
    table.text('iban').nullable().defaultTo(null)
    table.uuid('ownerId').notNullable().references('id').inTable('UserAccount')
    table.jsonb('billingDetails').notNullable()
    table.jsonb('bankAddress').notNullable()
    table.timestamp('createdAt').defaultTo(knex.fn.now()).notNullable()
    table.timestamp('updatedAt').defaultTo(knex.fn.now()).notNullable()
    table.text('error').nullable()
    table.check(
      `(iban is not null) or ("accountNumber" is not null and "routingNumber" is not null)`
    )
  })
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTable('WireBankAccount')
}
