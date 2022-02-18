import { PacksService } from '@algomart/shared/services'
import { DependencyResolver } from '@algomart/shared/utils'
import { Knex } from 'knex'
import { Model } from 'objection'

import { logger } from '../configuration/logger'

export default async function handlePackAuctionCompletionTask(
  registry: DependencyResolver,
  knexRead?: Knex
) {
  const log = logger.child({ task: 'handle-pack-auction-completion' })
  const packs = registry.get<PacksService>(PacksService.name)
  const trx = await Model.startTransaction()
  try {
    const result = await packs.handlePackAuctionCompletion(trx, knexRead)
    log.info('handled %d completed pack auctions', result)
    await trx.commit()
  } catch (error) {
    await trx.rollback()
    log.error(error as Error, 'failed to handle completed pack auctions')
  }
}
