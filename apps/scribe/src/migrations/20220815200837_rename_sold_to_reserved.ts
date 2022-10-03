import { Knex } from 'knex'

export async function up(knex: Knex): Promise<void> {
  await knex.raw(
    'UPDATE "CollectibleListings" SET "status" = \'reserved\' where "status" = \'sold\''
  )
}

export async function down(knex: Knex): Promise<void> {
  await knex.raw(
    'UPDATE "CollectibleListings" SET "status" = \'sold\' where "status" = \'reserved\''
  )
}
