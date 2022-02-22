import { PacksService } from '@algomart/shared/services'
import { DependencyResolver } from '@algomart/shared/utils'
import { Knex } from 'knex'
import { Model } from 'objection'
import pino from 'pino'

export async function handlePackAuctionExpirationTask(
  registry: DependencyResolver,
  logger: pino.Logger<unknown>,
  knexRead?: Knex
) {
  const log = logger.child({ task: 'handle-pack-auction-expiration' })
  const packs = registry.get<PacksService>(PacksService.name)
  const trx = await Model.startTransaction()
  try {
    const result = await packs.handlePackAuctionExpiration(trx, knexRead)
    log.info('handled %d expired pack auctions', result)
    await trx.commit()
  } catch (error) {
    await trx.rollback()
    log.error(error as Error, 'failed to handle expired pack auctions')
  }
}
