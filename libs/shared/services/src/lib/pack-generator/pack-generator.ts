import {
  DirectusCollectibleTemplate,
  PackBase,
  PackCollectibleOrder,
} from '@algomart/schemas'
import {
  chunkArray,
  invariant,
  randomRedemptionCode,
  shuffleArray,
} from '@algomart/shared/utils'

type PackToCreate = {
  templateId: string
  redeemCode: string | null
  collectibles: Array<{ edition: number; templateId: string }>
}

export function generatePack(
  packTemplate: PackBase,
  collectibleTemplates: DirectusCollectibleTemplate[]
): PackToCreate[] {
  const { collectibleTemplateIds, templateId, config } = packTemplate
  const collectibleTemplateIdsCount = collectibleTemplateIds.length

  invariant(
    collectibleTemplateIdsCount > 0,
    `no nft templates associated with pack template ${templateId}`
  )

  const groupedCollectibles = {} as {
    [key: string]: [string, number][]
  }

  // Generate arrays of collectible tuples (templateId/edition) for each template
  // Shuffle/random order if needed
  for (const collectibleTemplate of collectibleTemplates) {
    const collectibles = Array.from(
      { length: collectibleTemplate.total_editions },
      (_, index) => [collectibleTemplate.id, index + 1] as [string, number]
    )
    groupedCollectibles[collectibleTemplate.id] =
      config.collectibleOrder === PackCollectibleOrder.Random
        ? shuffleArray(collectibles)
        : collectibles
  }

  // Prioritize the least common collectibles, and flatten into one-dimensional array
  const listsOfCollectibles = Object.values(groupedCollectibles)
    .sort((a, b) => a.length - b.length)
    .flat()

  // If NFTs Per Pack is null, use the number of NFT Templates. And fallback to 1.
  // This is to avoid an out-of-memory error (x / null == Infinity)
  const collectiblesPerPack =
    config.collectiblesPerPack || collectibleTemplateIdsCount || 1

  const totalCollectibles = listsOfCollectibles.length

  // Create a maximum of 1 pack for auction templates
  const maxPacks =
    packTemplate.type === 'auction'
      ? 1
      : Math.floor(totalCollectibles / collectiblesPerPack)

  // Chunk the collectibles into buckets where the bucket size equals the number of packs
  // This will be a two-dimensional array with the templateId/edition tuples
  // The first dimension aligns in length with `collectiblesPerPack`
  // The second dimension aligns in length with `maxPacks`
  const bucketedCollectibles = chunkArray(listsOfCollectibles, maxPacks)

  // Sort the chunks into packs
  const packsToCreate = Array.from(
    { length: maxPacks },
    (_, index): PackToCreate => ({
      redeemCode:
        packTemplate.type === 'redeem' ? randomRedemptionCode() : null,
      templateId,
      collectibles: bucketedCollectibles.map((collectibles) => ({
        templateId: collectibles[index][0],
        edition: collectibles[index][1],
      })),
    })
  )

  // Ensure the number of collectibles per pack are as expected
  // Also verify that there are NO DUPLICATES
  const balancedPacks = packsToCreate.filter(
    (p) =>
      new Set(p.collectibles.map((c) => c.templateId)).size ===
      collectiblesPerPack
  )

  invariant(
    balancedPacks.length === maxPacks,
    `Expected ${maxPacks} balanced packs, got ${balancedPacks.length} for pack template ${templateId}`
  )

  return balancedPacks
}
