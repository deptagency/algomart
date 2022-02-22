import { CollectiblesService } from '@algomart/shared/services'
import { DependencyResolver } from '@algomart/shared/utils'
import { Knex } from 'knex'
import { Model } from 'objection'
import pino from 'pino'

export default async function generateCollectiblesTask(
  registry: DependencyResolver,
  logger: pino.Logger<unknown>,
  knexRead?: Knex
) {
  const log = logger.child({ task: 'generate-collectibles' })
  const collectibles = registry.get<CollectiblesService>(
    CollectiblesService.name
  )
  const trx = await Model.startTransaction()
  try {
    const result = await collectibles.generateCollectibles(
      undefined,
      trx,
      knexRead
    )
    log.info('generated %d collectibles', result)
    await trx.commit()
  } catch (error) {
    await trx.rollback()
    log.error(error as Error, 'failed to generate collectibles')
  }
}
