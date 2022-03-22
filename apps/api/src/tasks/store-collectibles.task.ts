import DependencyResolver from '@api/configuration/configure-resolver'
import { logger } from '@api/configuration/logger'
import CollectiblesService from '@api/modules/collectibles/collectibles.service'
import { Model } from 'objection'

export default async function storeCollectiblesTask(
  registry: DependencyResolver
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
