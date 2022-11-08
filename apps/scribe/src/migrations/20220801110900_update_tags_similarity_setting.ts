import { Knex } from 'knex'

export async function up(knex: Knex): Promise<void> {
  await knex.raw(`SET pg_trgm.similarity_threshold = 0.1;`)

  await knex.schema.raw(`
    CREATE OR REPLACE FUNCTION search_tags(i_query VARCHAR, i_language VARCHAR, i_limit INTEGER DEFAULT 10) 
      RETURNS SETOF "CmsCacheTags"
      AS $$
        SELECT tags.*
          FROM "CmsCacheTags" as tags
         WHERE tags."language" = i_language
           AND tags.search_title % unaccent(i_query)
         ORDER BY tags.search_title <-> unaccent(i_query), tags.id
         LIMIT i_limit;
      $$ LANGUAGE sql;
  `)
}

export async function down(knex: Knex): Promise<void> {
  await knex.raw(`SET pg_trgm.similarity_threshold = 0.3;`)

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
}
