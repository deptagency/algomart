import { logger } from '@api/configuration/logger'
import CollectiblesService from '@api/modules/collectibles/collectibles.service'
import DependencyResolver from '@api/shared/dependency-resolver'
import { Model } from 'objection'

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
