import { Model } from 'objection'

import CollectiblesService from '@/modules/collectibles/collectibles.service'
import DependencyResolver from '@/shared/dependency-resolver'
import { logger } from '@/utils/logger'

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
    log.info('stored %d collectibles on IPFS', result)
    await trx.commit()
  } catch (error) {
    await trx.rollback()
    log.error(error as Error, 'failed to store collectibles')
  }
}
