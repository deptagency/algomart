import { Knex } from 'knex'

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable('UserAccount', (table) => {
    table.text('applicantId').nullable()
    table.text('workflowRunId').nullable()
    table.text('verificationStatus').defaultTo('unverified').notNullable()
    table.timestamp('lastVerified').nullable()
    table.jsonb('recentWatchlistBreakdown').nullable()
  })
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable('UserAccount', (table) => {
    table.dropColumns(
      'applicantId',
      'workflowRunId',
      'verificationStatus',
      'lastVerified',
      'recentWatchlistBreakdown'
    )
  })
}
