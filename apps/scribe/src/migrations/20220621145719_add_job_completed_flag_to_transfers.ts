import { Knex } from 'knex'

export async function up(knex: Knex): Promise<void> {
  /**
   * The update-credits-transfer-status jobs have to perform follow-up/ clean-up tasks
   * AFTER the circle transfer is set to "complete"/ "failed" so, the
   * "status" field is no longer an accurate representation of the jobs completion
   * status
   */
  await knex.schema.alterTable('UserAccountTransfer', (table) => {
    table.timestamp('creditsTransferJobCompletedAt').nullable()
  })

  await knex.raw(
    'UPDATE "UserAccountTransfer" SET "creditsTransferJobCompletedAt" = now()'
  )
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable('UserAccountTransfer', (table) => {
    table.dropColumns('creditsTransferJobCompletedAt')
  })
}
