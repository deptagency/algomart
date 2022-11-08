import { Knex } from 'knex'

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable('PaymentCard', (table) => {
    table.boolean('isSaved').defaultTo(true)
    table.dropUnique(['externalId'])
    table.uuid('externalId').nullable().alter({ alterNullable: true })
    table.string('network').nullable().alter({ alterNullable: true })
    table.string('lastFour').nullable().alter({ alterNullable: true })
    table.string('expirationMonth').nullable().alter({ alterNullable: true })
    table.string('expirationYear').nullable().alter({ alterNullable: true })
  })
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable('PaymentCard', (table) => {
    table
      .uuid('externalId')
      .notNullable()
      .unique()
      .alter({ alterNullable: true })
    table.string('network').notNullable().alter({ alterNullable: true })
    table.string('lastFour').notNullable().alter({ alterNullable: true })
    table.string('expirationMonth').notNullable().alter({ alterNullable: true })
    table.string('expirationYear').notNullable().alter({ alterNullable: true })
    table.dropColumn('isSaved')
  })
}
