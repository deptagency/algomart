import { Model } from 'objection'

import PacksService from '@/modules/packs/packs.service'
import DependencyResolver from '@/shared/dependency-resolver'
import { logger } from '@/utils/logger'

export default async function handlePackAuctionCompletionTask(
  registry: DependencyResolver
) {
  const log = logger.child({ task: 'handle-pack-auction-completion' })
  const packs = registry.get<PacksService>(PacksService.name)
  const trx = await Model.startTransaction()
  try {
    const result = await packs.handlePackAuctionCompletion(trx)
    log.info('handled %d completed pack auctions', result)
    await trx.commit()
  } catch (error) {
    await trx.rollback()
    log.error(error as Error, 'failed to handle completed pack auctions')
  }
}
