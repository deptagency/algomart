import { Knex } from 'knex'

export async function up(knex: Knex): Promise<void> {
  // Creates a partial unique index to add a constraint
  // where a user can only have one pending transfer at a time
  await knex.schema.raw(`
        CREATE UNIQUE INDEX one_pending_per_user ON "UserAccountTransfer" ("userAccountId", status) WHERE status = 'pending';
    `)
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.raw(`
        DROP INDEX one_pending_per_user;
    `)
}
