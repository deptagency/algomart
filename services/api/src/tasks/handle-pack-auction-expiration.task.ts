import { Model } from 'objection'

import PacksService from '@/modules/packs/packs.service'
import DependencyResolver from '@/shared/dependency-resolver'
import { logger } from '@/utils/logger'

export default async function handlePackAuctionCompletionTask(
  registry: DependencyResolver
) {
  const log = logger.child({ task: 'handle-pack-auction-expiration' })
  const packs = registry.get<PacksService>(PacksService.name)
  const trx = await Model.startTransaction()
  try {
    const result = await packs.handlePackAuctionExpiration(trx)
    log.info('handled %d expired pack auctions', result)
    await trx.commit()
  } catch (error) {
    await trx.rollback()
    log.error(error as Error, 'failed to handle expired pack auctions')
  }
}
