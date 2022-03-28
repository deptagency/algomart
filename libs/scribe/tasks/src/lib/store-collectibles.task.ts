import { CollectiblesService } from '@algomart/shared/services'
import { DependencyResolver } from '@algomart/shared/utils'
import { Model } from 'objection'
import pino from 'pino'

export async function storeCollectiblesTask(
  registry: DependencyResolver,
  logger: pino.Logger<unknown>
) {
  const log = logger.child({ task: 'store-collectibles' })
  const collectibles = registry.get<CollectiblesService>(
    CollectiblesService.name
  )
  const trx = await Model.startTransaction()
  try {
    const result = await collectibles.storeCollectibles(undefined, trx)
    log.info('stored IPFS records for %d collectibles templates', result)
    await trx.commit()
  } catch (error) {
    await trx.rollback()
    log.error(
      error as Error,
      'failed to store IPFS records for collectible templates'
    )
  }
}
