import { PackStatus, PackType } from '@algomart/schemas'
import { CMSCacheService, toPackBase } from '@algomart/shared/services'
import {
  packFactory,
  packTemplateFactory,
  setupTestDatabase,
  teardownTestDatabase,
} from '@algomart/shared/tests'
import { randomRedemptionCode } from '@algomart/shared/utils'
import { buildTestApp } from '@api-tests/build-test-app'
import { FastifyInstance } from 'fastify'

let app: FastifyInstance

beforeEach(async () => {
  await setupTestDatabase('packs_test_db', { returnKnex: false })
  app = await buildTestApp('packs_test_db')
})

afterEach(async () => {
  await app.close()
  await teardownTestDatabase('packs_test_db')
})

test('GET /packs/search OK', async () => {
  // Arrange
  const packTemplate = packTemplateFactory.build()
  const translation =
    typeof packTemplate.translations[0] !== 'number'
      ? packTemplate.translations[0]
      : null
  const packs = packFactory.buildList(
    5,
    {},
    {
      template: packTemplate,
    }
  )
  await app.knex('CmsCachePackTemplates').insert({
    id: packTemplate.id,
    content: packTemplate,
    price: packTemplate.price,
    slug: packTemplate.slug,
    type: packTemplate.type,
    releasedAt: packTemplate.released_at,
    auctionUntil: packTemplate.auction_until,
  })
  await app.knex('Pack').insert(packs)

  // Act
  const { body, statusCode, headers } = await app.inject({
    method: 'GET',
    url: '/packs/search',
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
        additionalImages: [],
        allowBidExpiration: false,
        available: 5,
        body: translation?.body,
        config: {
          collectibleDistribution: packTemplate.nft_distribution,
          collectibleOrder: packTemplate.nft_order,
          collectiblesPerPack: packTemplate.nfts_per_pack,
        },
        onePackPerCustomer: false,
        price: packTemplate.price,
        image: `http://localhost/assets/${packTemplate.pack_image.id}`,
        nftsPerPack: 1,
        releasedAt: packTemplate.released_at,
        showNfts: false,
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
    .spyOn(CMSCacheService.prototype, 'findPackByTemplateId')
    .mockResolvedValue(
      toPackBase(packTemplate, {
        cmsUrl: 'http://localhost',
        gcpCdnUrl: undefined,
      })
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
      additionalImages: [],
      allowBidExpiration: false,
      body: translation?.body,
      config: {
        collectibleDistribution: packTemplate.nft_distribution,
        collectibleOrder: packTemplate.nft_order,
        collectiblesPerPack: packTemplate.nfts_per_pack,
      },
      // Image: packTemplate.pack_image,
      onePackPerCustomer: false,
      price: packTemplate.price,
      image: `http://localhost/assets/${packTemplate.pack_image.id}`,
      nftsPerPack: 1,
      id: pack.id,
      releasedAt: packTemplate.released_at,
      showNfts: false,
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
