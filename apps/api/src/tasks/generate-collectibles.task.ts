import { CollectiblesService } from '@algomart/shared/services'
import { DependencyResolver } from '@algomart/shared/utils'
import { logger } from '@api/configuration/logger'
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
