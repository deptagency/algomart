import { Model } from 'objection'

import CollectiblesService from '@/modules/collectibles/collectibles.service'
import DependencyResolver from '@/shared/dependency-resolver'
import { logger } from '@/utils/logger'

export default async function mintCollectiblesTask(
  registry: DependencyResolver
) {
  const log = logger.child({ task: 'mint-collectibles' })
  const collectibles = registry.get<CollectiblesService>(
    CollectiblesService.name
  )
  const trx = await Model.startTransaction()
  try {
    const result = await collectibles.mintCollectibles(undefined, trx)
    log.info('minted %d collectibles', result)
    await trx.commit()
  } catch (error) {
    await trx.rollback()
    log.error(error as Error, 'failed to mint collectibles')
  }
}
