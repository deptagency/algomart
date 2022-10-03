import { Knex } from 'knex'

export async function up(knex: Knex): Promise<void> {
  // Creates a partial unique index to add a constraint such that
  // a given entityId/ userAccountId can only have one non-failed transfer at a time.
  // This prevents race conditions for processes inserting transfers so that we avoid double-transfers in circle
  // The inclusion of "userAccountId" is for secondary marketplace transfers. The same collectible will have 2 pending
  // transfers, one for the buyer and one for the seller.
  await knex.schema.raw(`
    CREATE UNIQUE INDEX one_non_failed_per_entity ON "UserAccountTransfer" ("entityId", "entityType", "userAccountId") WHERE "status" <> 'failed';
  `)
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.raw(`
    DROP INDEX one_non_failed_per_entity;
  `)
}
