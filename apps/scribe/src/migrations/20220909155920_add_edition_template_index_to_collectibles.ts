import { Knex } from 'knex'

export async function up(knex: Knex): Promise<void> {
  await knex.schema.raw(`
    CREATE UNIQUE INDEX edition_template ON "Collectible" ("templateId", "edition");
  `)
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.raw(`
    DROP INDEX edition_template;
  `)
}
