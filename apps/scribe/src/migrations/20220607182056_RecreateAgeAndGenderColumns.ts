import { Knex } from 'knex'

export async function up(knex: Knex): Promise<void> {
  await knex.raw(`
    -- Set age to NULL if not a number
    UPDATE "UserAccount"
    SET "age" = NULL
    WHERE "age" ~ '^[^0-9]+$';

    -- Set gender to NULL if not valid value
    UPDATE "UserAccount"
    SET "gender" = NULL
    WHERE "gender" NOT IN ('not-applicable', 'other', 'male', 'female', 'non-binary');
  `)

  await knex.schema.alterTable('UserAccount', (table) => {
    table.text('gender').nullable().alter()
    table.integer('age').nullable().alter()
  })
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable('UserAccount', (table) => {
    table.string('gender').alter()
    table.string('age').alter()
  })
}
