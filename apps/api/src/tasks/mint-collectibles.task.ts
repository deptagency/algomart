import { CollectiblesService } from '@algomart/shared/services'
import { DependencyResolver } from '@algomart/shared/utils'
import { Model } from 'objection'

import { logger } from '../configuration/logger'

export default async function mintCollectibles(registry: DependencyResolver) {
  const log = logger.child({ task: 'mint-collectibles' })
  const collectibles = registry.get<CollectiblesService>(
    CollectiblesService.name
  )
  const trx = await Model.startTransaction()
  try {
    const result = await collectibles.mintCollectibles(trx)
    log.info('minted %d collectibles', result)
    await trx.commit()
  } catch (error) {
    await trx.rollback()
    log.error(error as Error, 'failed to mint collectibles')
  }
}
