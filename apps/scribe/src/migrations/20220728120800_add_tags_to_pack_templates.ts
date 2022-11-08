import { Knex } from 'knex'

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable('CmsCachePackTemplates', (table) => {
    table.specificType('tags', 'text[]')
  })

  await knex.raw(
    `CREATE INDEX cms_cache_pack_template_tags ON "CmsCachePackTemplates" USING GIN(tags);`
  )

  await knex.schema.raw(`
    CREATE OR REPLACE FUNCTION search_pack_templates(i_tags text[]) 
      RETURNS SETOF "CmsCachePackTemplates"
      AS $$
        SELECT templates
          FROM "CmsCachePackTemplates" AS templates
         WHERE i_tags <@ templates.tags;
      $$ LANGUAGE sql;
  `)
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.raw(`DROP FUNCTION search_pack_templates(i_tags text[]);`)

  await knex.schema.alterTable('CmsCachePackTemplates', (table) => {
    table.dropColumn('tags')
  })
}
