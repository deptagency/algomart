import { CollectiblesService } from '@algomart/shared/services'
import { DependencyResolver } from '@algomart/shared/utils'
import { Knex } from 'knex'
import { Model } from 'objection'

import { logger } from '../configuration/logger'

export default async function storeCollectiblesTask(
  registry: DependencyResolver,
  knexRead?: Knex
) {
  const log = logger.child({ task: 'store-collectibles' })
  const collectibles = registry.get<CollectiblesService>(
    CollectiblesService.name
  )
  const trx = await Model.startTransaction()
  try {
    const result = await collectibles.storeCollectibles(
      undefined,
      trx,
      knexRead
    )
    log.info('stored %d collectibles on IPFS', result)
    await trx.commit()
  } catch (error) {
    await trx.rollback()
    log.error(error as Error, 'failed to store collectibles')
  }
}
