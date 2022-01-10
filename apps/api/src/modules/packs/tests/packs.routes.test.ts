import { PackStatus, PackType } from '@algomart/schemas'
import { FastifyInstance } from 'fastify'
import { buildTestApp } from 'test/build-test-app'

import DirectusAdapter, { toPackBase } from '@/lib/directus-adapter'
import { packFactory, packTemplateFactory } from '@/seeds/seed-test-data'
import { randomRedemptionCode } from '@/utils/random'

let app: FastifyInstance

beforeEach(async () => {
  app = await buildTestApp()
})

afterEach(async () => {
  await app.close()
})

test('GET /packs OK', async () => {
  // Arrange
  const packTemplate = packTemplateFactory.build()
  const translation =
    typeof packTemplate.translations[0] !== 'number'
      ? packTemplate.translations[0]
      : null

  jest.spyOn(DirectusAdapter.prototype, 'findAllPacks').mockResolvedValue({
    packs: [toPackBase(packTemplate, () => 'http://localhost/image.jpg')],
    total: 1,
  })

  const packs = packFactory.buildList(
    5,
    {},
    {
      template: packTemplate,
    }
  )

  await app.knex('Pack').insert(packs)

  // Act
  const { body, statusCode, headers } = await app.inject({
    method: 'GET',
    url: '/packs',
    headers: {
      authorization: 'Bearer test-api-key',
    },
  })

  // Assert
  expect(statusCode).toBe(200)
  expect(headers['content-type']).toMatch(/application\/json/)
  const json = JSON.parse(body)
  expect(json).toEqual({
    packs: [
      {
        allowBidExpiration: false,
        available: 5,
        body: translation?.body,
        collectibleTemplateIds: [],
        config: {
          collectibleDistribution: packTemplate.nft_distribution,
          collectibleOrder: packTemplate.nft_order,
          collectiblesPerPack: packTemplate.nfts_per_pack,
        },
        // Image: packTemplate.pack_image,
        onePackPerCustomer: false,
        price: packTemplate.price,
        image: 'http://localhost/image.jpg',
        releasedAt: packTemplate.released_at,
        slug: packTemplate.slug,
        subtitle: translation?.subtitle,
        status: PackStatus.Active,
        templateId: packTemplate.id,
        title: translation?.title,
        total: 5,
        type: packTemplate.type,
      },
    ],
    total: 1,
  })
})

test('GET /packs/redeemable/:redeemCode', async () => {
  // Arrange
  const redeemCode = randomRedemptionCode()
  const packTemplate = packTemplateFactory.build({
    type: PackType.Redeem,
  })
  const translation =
    typeof packTemplate.translations[0] !== 'number'
      ? packTemplate.translations[0]
      : null

  jest
    .spyOn(DirectusAdapter.prototype, 'findPack')
    .mockResolvedValue(
      toPackBase(packTemplate, () => 'http://localhost/image.jpg')
    )

  const pack = packFactory.build(
    {
      redeemCode,
    },
    {
      template: packTemplate,
    }
  )

  await app.knex('Pack').insert(pack)

  // Act
  const { body, statusCode, headers } = await app.inject({
    method: 'GET',
    url: `/packs/redeemable/${redeemCode}`,
    headers: {
      authorization: 'Bearer test-api-key',
    },
  })

  // Assert
  expect(statusCode).toBe(200)
  expect(headers['content-type']).toMatch(/application\/json/)
  const json = JSON.parse(body)
  expect(json).toEqual({
    pack: {
      allowBidExpiration: false,
      body: translation?.body,
      collectibleTemplateIds: [],
      config: {
        collectibleDistribution: packTemplate.nft_distribution,
        collectibleOrder: packTemplate.nft_order,
        collectiblesPerPack: packTemplate.nfts_per_pack,
      },
      // Image: packTemplate.pack_image,
      onePackPerCustomer: false,
      price: packTemplate.price,
      image: 'http://localhost/image.jpg',
      id: pack.id,
      releasedAt: packTemplate.released_at,
      slug: packTemplate.slug,
      subtitle: translation?.subtitle,
      status: PackStatus.Active,
      templateId: packTemplate.id,
      title: translation?.title,
      type: packTemplate.type,
    },
  })
})

// TODO: add test cases for various errors...
