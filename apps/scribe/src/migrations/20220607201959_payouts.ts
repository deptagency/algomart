import { Knex } from 'knex'

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('Payout', (table) => {
    table.uuid('id').primary()
    table.timestamp('createdAt').defaultTo(knex.fn.now()).notNullable()
    table.timestamp('updatedAt').defaultTo(knex.fn.now()).notNullable()

    table.uuid('userId').references('id').inTable('UserAccount').notNullable()
    // usdca | bank
    table.text('payoutType').notNullable()
    // Algorand account
    table.string('destinationAddress', 58).nullable()
    // Not currently used, in future we may use this to store the bank id from circle
    table.string('externalBankId').nullable()
  })
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTable('Payout')
}
