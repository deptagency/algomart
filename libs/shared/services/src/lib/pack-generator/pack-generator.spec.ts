import {
  DirectusCollectibleTemplate,
  PackBase,
  PackCollectibleDistribution,
  PackCollectibleOrder,
  PackStatus,
  PackType,
} from '@algomart/schemas'
import { Factory } from 'rosie'
import { v4 as uuid } from 'uuid'

import { generatePack } from './pack-generator'

Factory.define<PackBase>('PackTemplate')
  .attr('templateId', () => uuid())
  .attrs({
    additionalImages: [],
    allowBidExpiration: false,
    config: {
      collectibleDistribution: PackCollectibleDistribution.Random,
      collectibleOrder: PackCollectibleOrder.Random,
      collectiblesPerPack: 3,
    },
    image: 'https://example.com',
    nftsPerPack: 3,
    onePackPerCustomer: false,
    price: 1000,
    slug: 'fake-pack',
    status: PackStatus.Active,
    title: 'Fake Pack',
    type: PackType.Purchase,
    releasedAt: new Date().toISOString(),
  })

Factory.define<DirectusCollectibleTemplate>('CollectibleTemplate')
  .attr('id', () => uuid())
  .attrs({})

function makeCollectibleTemplates(
  totalEditions: number[]
): DirectusCollectibleTemplate[] {
  const templates = Factory.buildList<DirectusCollectibleTemplate>(
    'CollectibleTemplate',
    totalEditions.length
  )

  return templates.map((template, index) => ({
    ...template,
    total_editions: totalEditions[index],
  }))
}

describe('generatePack', () => {
  test('generates an even number of packs', () => {
    const collectibles = makeCollectibleTemplates([10, 10, 10])
    const packTemplate = Factory.build<PackBase>('PackTemplate')
    packTemplate.collectibleTemplateIds = [
      ...new Set(collectibles.map((t) => t.id)),
    ]

    const result = generatePack(packTemplate, collectibles)

    expect(result).toHaveLength(10)
  })

  test('generates an even number of packs with different set', () => {
    const collectibles = makeCollectibleTemplates(
      [158, 158, 158, 158, 158, 158, 158, 159, 159, 30, 30, 8, 8].reverse()
    )
    const packTemplate = Factory.build<PackBase>('PackTemplate')
    packTemplate.collectibleTemplateIds = [
      ...new Set(collectibles.map((t) => t.id)),
    ]

    const result = generatePack(packTemplate, collectibles)

    expect(result).toHaveLength(500)
    expect(
      collectibles.find((c) => c.id === packTemplate.collectibleTemplateIds[0])
        .total_editions
    ).toBe(8)
    expect(
      collectibles.find((c) => c.id === packTemplate.collectibleTemplateIds[1])
        .total_editions
    ).toBe(8)
    expect([
      packTemplate.collectibleTemplateIds[0],
      packTemplate.collectibleTemplateIds[1],
    ]).toContain(result[0].collectibles[0].templateId)
  })

  test('cannot generate if editions and nfts per pack do not to add up', () => {
    const collectibles = makeCollectibleTemplates([250, 50])
    const packTemplate = Factory.build<PackBase>('PackTemplate')
    packTemplate.collectibleTemplateIds = [
      ...new Set(collectibles.map((t) => t.id)),
    ]
    packTemplate.nftsPerPack = 2
    packTemplate.config.collectiblesPerPack = 2

    expect(() => generatePack(packTemplate, collectibles)).toThrow()
  })

  test('generates single auction pack', () => {
    const collectibles = makeCollectibleTemplates([1, 1, 1, 1, 1, 1])
    const packTemplate = Factory.build<PackBase>('PackTemplate')
    packTemplate.collectibleTemplateIds = [
      ...new Set(collectibles.map((t) => t.id)),
    ]
    packTemplate.type = PackType.Auction
    packTemplate.nftsPerPack = 6
    packTemplate.config.collectiblesPerPack = 6
    packTemplate.config.collectibleDistribution =
      PackCollectibleDistribution.OneOfEach
    packTemplate.config.collectibleOrder = PackCollectibleOrder.Match

    const result = generatePack(packTemplate, collectibles)

    expect(result).toHaveLength(1)
  })

  test('generates single auction pack despite multiple editions', () => {
    const collectibles = makeCollectibleTemplates([5, 5, 5, 5, 5, 5])
    const packTemplate = Factory.build<PackBase>('PackTemplate')
    packTemplate.collectibleTemplateIds = [
      ...new Set(collectibles.map((t) => t.id)),
    ]
    packTemplate.type = PackType.Auction
    packTemplate.nftsPerPack = 6
    packTemplate.config.collectiblesPerPack = 6
    packTemplate.config.collectibleDistribution =
      PackCollectibleDistribution.OneOfEach
    packTemplate.config.collectibleOrder = PackCollectibleOrder.Match

    const result = generatePack(packTemplate, collectibles)

    expect(result).toHaveLength(1)
  })

  test('stress test', () => {
    // total 1.5 million NFTs
    const collectibles = makeCollectibleTemplates(
      Array.from({ length: 40 }, () => 37_500)
    )

    const packTemplate = Factory.build<PackBase>('PackTemplate')

    packTemplate.collectibleTemplateIds = [
      ...new Set(collectibles.map((t) => t.id)),
    ]
    packTemplate.type = PackType.Purchase
    packTemplate.price = 1000
    packTemplate.nftsPerPack = 3
    packTemplate.config.collectiblesPerPack = 3
    packTemplate.config.collectibleDistribution =
      PackCollectibleDistribution.Random
    packTemplate.config.collectibleOrder = PackCollectibleOrder.Random

    const packs = generatePack(packTemplate, collectibles)

    expect(packs).toHaveLength(500_000)
  })
})
