import pino from 'pino'
import { CollectiblesService } from '@algomart/shared/services'
import { DependencyResolver } from '@algomart/shared/utils'
import { Model } from 'objection'

export async function mintCollectiblesTask(
  registry: DependencyResolver,
  logger: pino.Logger<unknown>
) {
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
