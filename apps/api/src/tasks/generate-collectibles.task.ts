import { logger } from '@api/configuration/logger'
import CollectiblesService from '@api/modules/collectibles/collectibles.service'
import DependencyResolver from '@api/shared/configure-resolver'
import { Model } from 'objection'

export default async function generateCollectiblesTask(
  registry: DependencyResolver
) {
  const log = logger.child({ task: 'generate-collectibles' })
  const collectibles = registry.get<CollectiblesService>(
    CollectiblesService.name
  )
  const trx = await Model.startTransaction()
  try {
    const result = await collectibles.generateCollectibles(undefined, trx)
    log.info('generated %d collectibles', result)
    await trx.commit()
  } catch (error) {
    await trx.rollback()
    log.error(error as Error, 'failed to generate collectibles')
  }
}
