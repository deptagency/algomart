import { Knex } from 'knex'

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable('UserAccount', (table) => {
    table.renameColumn('workflowRunId', 'lastWorkflowRunId')
  })
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable('UserAccount', (table) => {
    table.renameColumn('lastWorkflowRunId', 'workflowRunId')
  })
}
