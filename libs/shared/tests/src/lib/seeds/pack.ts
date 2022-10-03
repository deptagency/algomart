import { AlgorandTransactionStatus } from '@algomart/schemas'
import { Knex } from 'knex'

import {
  algorandTransactionFactory,
  collectibleFactory,
  collectibleTemplateFactory,
  packFactory,
  packTemplateFactory,
} from './factories'

export async function createOwnedPackWithCollectibles(
  knex: Knex,
  {
    collectiblesCount,
    ownerId,
    redeemCode,
    transactionDate = new Date(),
  }: {
    redeemCode?: string
    collectiblesCount?: number
    ownerId?: string
    transactionDate?: Date
  }
) {
  const pack = packFactory.build({
    claimedAt: ownerId ? new Date().toISOString() : null,
    ownerId,
    redeemCode,
  })
  const collectibleCreateTransactions = algorandTransactionFactory.buildList(
    collectiblesCount,
    {
      status: AlgorandTransactionStatus.Confirmed,
      createdAt: transactionDate.toISOString(),
      updatedAt: transactionDate.toISOString(),
    }
  )
  const collectibleTransferTransactions = algorandTransactionFactory.buildList(
    collectiblesCount,
    {
      status: AlgorandTransactionStatus.Confirmed,
      createdAt: transactionDate.toISOString(),
      updatedAt: transactionDate.toISOString(),
    }
  )
  const collectibles = collectibleFactory.buildList(collectiblesCount, {
    packId: pack.id,
    claimedAt: ownerId ? new Date().toISOString() : null,
    ownerId,
  })
  for (const [index, collectible] of collectibles.entries()) {
    collectible.address = index + 1
    collectible.creationTransactionId = collectibleCreateTransactions[index].id
    if (ownerId) {
      collectible.latestTransferTransactionId =
        collectibleTransferTransactions[index].id
    }
  }

  await knex('Pack').insert(pack)
  await knex('AlgorandTransaction').insert([
    ...collectibleCreateTransactions,
    ...collectibleTransferTransactions,
  ])
  await knex('Collectible').insert(collectibles)

  return {
    pack,
    collectibles,
    collectibleCreateTransactions,
    collectibleTransferTransactions,
  }
}

export async function createUnclaimedPack(
  knex: Knex,
  {
    collectiblesCount,
    redeemCode,
  }: {
    redeemCode?: string
    collectiblesCount?: number
  }
) {
  const packTemplate = packTemplateFactory.build()

  const pack = packFactory.build({
    templateId: packTemplate.id,
    ownerId: null,
    claimedAt: null,
    redeemCode,
  })

  const packTemplateInsert = {
    id: packTemplate.id,
    content: JSON.stringify(packTemplate), // todo <- this isn't an accurate content mock
    type: packTemplate.type,
    releasedAt: packTemplate.released_at,
    createdAt: packTemplate.released_at,
    updatedAt: packTemplate.released_at,
    price: packTemplate.price,
    slug: packTemplate.slug,
  }

  const collectibleTemplates =
    collectibleTemplateFactory.buildList(collectiblesCount)
  const collectibles = collectibleFactory
    .buildList(collectiblesCount, {
      packId: pack.id,
      claimedAt: null,
      ownerId: null,
    })
    .map((collectible, index) => ({
      ...collectible,
      id: collectible.id,
      templateId: collectibleTemplates[index].id,
    }))

  const collectibleTemplateInserts = collectibleTemplates.map(
    (template, index) => ({
      id: template.id,
      content: JSON.stringify(template), // todo <- this isn't an accurate content mock
      createdAt: collectibles[index].createdAt,
      updatedAt: collectibles[index].createdAt,
    })
  )

  await knex('CmsCachePackTemplates').insert(packTemplateInsert)
  await knex('CmsCacheCollectibleTemplates').insert(collectibleTemplateInserts)
  await knex('Pack').insert(pack)
  await knex('Collectible').insert(collectibles)

  return { pack, collectibles }
}
