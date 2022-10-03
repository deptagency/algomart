import {
  CollectibleListingStatus,
  CollectibleListingType,
} from '@algomart/schemas'
import { Knex } from 'knex'

import { collectibleListingsModelFactory } from './factories'

export async function createCollectibleListing(
  knex: Knex,
  {
    sellerId,
    buyerId,
    collectibleId,
    price,
    status = CollectibleListingStatus.Active,
    type = CollectibleListingType.FixedPrice,
  }: {
    sellerId: string
    buyerId?: string
    collectibleId: string
    price: number
    status?: CollectibleListingStatus
    type?: CollectibleListingType
  }
) {
  // Requires:
  // - user account for seller
  // - owned pack with one or more collectibles
  // Optional:
  // - user account for buyer

  const collectibleListing = collectibleListingsModelFactory.build({
    collectibleId,
    sellerId,
    buyerId,
    price,
    status,
    type,
  })

  await knex('CollectibleListings').insert(collectibleListing)

  return { collectibleListing }
}
