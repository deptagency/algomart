import { Knex } from 'knex'

export async function up(knex: Knex): Promise<void> {
  await knex.raw('CREATE EXTENSION pg_trgm;')
  await knex.raw('CREATE EXTENSION unaccent;')

  await knex.schema.createTable('CmsCacheTags', (table) => {
    table.uuid('id').notNullable().index()
    table.string('slug').notNullable()
    table.string('language').notNullable()
    table.string('title').notNullable()
    table.string('search_title').notNullable()
    table.timestamp('createdAt').defaultTo(knex.fn.now()).notNullable()
    table.timestamp('updatedAt').defaultTo(knex.fn.now()).notNullable()

    table.primary(['id', 'language'])
    table.unique(['slug', 'language'])
  })

  // When a transfer completes, update the new balance on the transfer and on the userAccount
  await knex.schema.raw(`
    CREATE FUNCTION set_tag_search_title() RETURNS trigger
      LANGUAGE plpgsql
      AS $$
      BEGIN
        NEW.search_title = unaccent(NEW.title);
        RETURN NEW;
      END
      $$;
  `)

  await knex.schema.raw(`
    CREATE TRIGGER set_tag_search_title BEFORE INSERT OR UPDATE ON "CmsCacheTags"
      FOR EACH ROW EXECUTE FUNCTION set_tag_search_title()
  `)

  await knex.schema.raw(
    `CREATE INDEX cms_cache_tags_search_idx ON "CmsCacheTags" USING GIST(search_title gist_trgm_ops);`
  )

  await knex.schema.alterTable('CmsCacheCollectibleTemplates', (table) => {
    table.specificType('tags', 'text[]')
  })

  await knex.raw(
    `CREATE INDEX cms_cache_collectible_template_tags ON "CmsCacheCollectibleTemplates" USING GIN(tags);`
  )

  await knex.schema.raw(`
    CREATE OR REPLACE FUNCTION search_tags(i_query VARCHAR, i_language VARCHAR, i_limit INTEGER DEFAULT 10) 
      RETURNS SETOF "CmsCacheTags"
      AS $$
        SELECT tags.*
          FROM "CmsCacheTags" as tags
         WHERE tags."language" = i_language
           AND tags.search_title % unaccent(i_query)
         ORDER BY tags.search_title <-> unaccent(i_query)
         LIMIT i_limit;
      $$ LANGUAGE sql;
  `)

  await knex.schema.raw(`
    CREATE OR REPLACE FUNCTION search_collectible_templates(i_tags text[]) 
      RETURNS SETOF "CmsCacheCollectibleTemplates"
      AS $$
        SELECT templates
          FROM "CmsCacheCollectibleTemplates" AS templates
         WHERE i_tags <@ templates.tags;
      $$ LANGUAGE sql;
  `)
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.raw(
    `DROP FUNCTION search_tags(i_query VARCHAR, i_language VARCHAR, i_limit INTEGER);`
  )
  await knex.schema.raw(
    `DROP FUNCTION search_collectible_templates(i_tags text[]);`
  )

  await knex.schema.alterTable('CmsCacheCollectibleTemplates', (table) => {
    table.dropColumn('tags')
  })

  await knex.schema.dropTable('CmsCacheTags')
  await knex.schema.raw(`DROP FUNCTION set_tag_search_title();`)

  await knex.raw('DROP EXTENSION pg_trgm;')
  await knex.raw('DROP EXTENSION unaccent;')
}
