import { Knex } from 'knex'

export async function up(knex: Knex): Promise<void> {
  await knex.schema.raw(`
    DROP INDEX one_pending_per_user;
`)
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.raw(`
    CREATE UNIQUE INDEX one_pending_per_user ON "UserAccountTransfer" ("userAccountId", status) WHERE status = 'pending';
`)
}
