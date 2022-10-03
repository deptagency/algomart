import { Knex } from 'knex'

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable('CollectibleOwnership', (table) => {
    table.dropUnique(['collectibleId', 'ownerId'])
    table.index(['collectibleId', 'ownerId'])
  })
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable('CollectibleOwnership', (table) => {
    table.dropIndex(['ownerId', 'collectibleId'])
    table.unique(['ownerId', 'collectibleId'])
  })
}
