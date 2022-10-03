import { Knex } from 'knex'

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable('UserAccount', (table) => {
    table.string('provider')
    table.string('username').nullable().alter({ alterNullable: true })
  })

  await knex.schema.raw(`
    -- For existing User Accounts, set provider to ping if externalId UUID, otherwise set to email
    UPDATE "UserAccount" as ua
    SET "provider" =
        CASE
            WHEN ua."externalId" ~ E'^[[:xdigit:]]{8}-([[:xdigit:]]{4}-){3}[[:xdigit:]]{12}$' THEN 'ping'
            ELSE 'email'
        END
    FROM "UserAccount"
  `)

  await knex.schema.alterTable('UserAccount', (table) => {
    table.string('provider').notNullable().alter({ alterNullable: true })
  })
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable('UserAccount', (table) => {
    table.dropColumn('provider')
    table.string('username').notNullable().alter({ alterNullable: true })
  })
}
