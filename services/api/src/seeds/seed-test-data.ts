import {
  AlgorandAccount,
  AlgorandTransaction,
  AlgorandTransactionStatus,
  Collectible,
  DEFAULT_LOCALE,
  Pack,
  PackCollectibleDistribution,
  PackCollectibleOrder,
  PackType,
  UserAccount,
} from '@algomart/schemas'
import { Knex } from 'knex'
import { Factory } from 'rosie'
import { fakeAddressFor } from 'test/setup-tests'
import { v4 } from 'uuid'

import {
  DirectusCollectibleTemplate,
  DirectusPackTemplate,
  DirectusRarity,
  DirectusStatus,
} from '@/lib/directus-adapter'
import { encrypt } from '@/utils/encryption'

// #region Factories

export const algorandTransactionFactory = Factory.define<AlgorandTransaction>(
  'AlgorandTransaction'
)
  .sequence('id', () => v4())
  .attr('address', () => fakeAddressFor('transaction'))
  .attr('createdAt', () => new Date().toISOString())
  .attr('updatedAt', () => new Date().toISOString())
  .attr('error', () => null)
  .attr('groupId', () => null)
  .attr('status', AlgorandTransactionStatus.Pending)

export const algorandAccountFactory = Factory.define<AlgorandAccount>(
  'AlgorandAccount'
)
  .sequence('id', () => v4())
  .option('creationTransaction', () => algorandTransactionFactory.build())
  .option('mnemonic', 'secret mnemonic')
  .option('passphrase', '000000')
  .attr('address', () => fakeAddressFor('account'))
  .attr('createdAt', () => new Date().toISOString())
  .attr('updatedAt', () => new Date().toISOString())
  .attr(
    'creationTransactionId',
    ['creationTransaction'],
    (creationTransaction) => creationTransaction.id
  )
  .attr('encryptedKey', ['mnemonic', 'passphrase'], (mnemonic, passphrase) =>
    encrypt(mnemonic, passphrase)
  )

export const userAccountFactory = Factory.define<UserAccount>('UserAccount')
  .sequence('id', () => v4())
  .option('algorandAccount', () => algorandAccountFactory.build())
  .attr(
    'algorandAccountId',
    ['algorandAccount'],
    (algorandAccount) => algorandAccount.id
  )
  .attr('locale', () => DEFAULT_LOCALE)
  .attr('createdAt', () => new Date().toISOString())
  .attr('updatedAt', () => new Date().toISOString())
  .attr('externalId', () => v4())
  .attr('username', () => 'test')
  .attr('email', ['username'], (username) => `${username}@test.local`)
  .attr('locale', () => DEFAULT_LOCALE)

export const rarityFactory = Factory.define<DirectusRarity>('DirectusRarity')
  .sequence('id', () => v4())
  .option('name', 'Test Rarity')
  .attr('code', 'RR')
  .attr('color', '#FF0000')
  .attr('translations', ['name'], (name) => [
    {
      language_code: DEFAULT_LOCALE,
      name,
    },
  ])

export const collectibleTemplateFactory =
  Factory.define<DirectusCollectibleTemplate>('DirectusCollectibleTemplate')
    .sequence('id', () => v4())
    .option('title', 'Test Collectible')
    .option('subtitle', 'Test Collectible Subtitle')
    .option('body', 'Test Collectible Body')
    .attr('pack_template', () => packTemplateFactory.build())
    .attr('preview_image', () => v4())
    .attr('rarity', () => rarityFactory.build())
    .attr('status', DirectusStatus.Published)
    .attr('total_editions', 10)
    .attr('unique_code', 'CODE0000')
    .attr(
      'translations',
      ['title', 'subtitle', 'body'],
      (title, subtitle, body) => [
        {
          language_code: DEFAULT_LOCALE,
          title,
          subtitle,
          body,
        },
      ]
    )

export const packTemplateFactory = Factory.define<DirectusPackTemplate>(
  'PackTemplate'
)
  .sequence('id', () => v4())
  .option('title', 'Test Pack')
  .option('subtitle', 'Test Pack Subtitle')
  .option('body', 'Test Pack Body')
  .attr('additional_images', [])
  .attr('auction_until', null)
  .attr('nft_distribution', PackCollectibleDistribution.Random)
  .attr('nft_order', PackCollectibleOrder.Random)
  .attr('nft_templates', [])
  .attr('nfts_per_pack', 1)
  .attr('pack_image', () => v4())
  .attr('price', 0)
  .attr('released_at', () => new Date().toISOString())
  .attr('slug', 'test-pack')
  .attr('show_nfts', false)
  .attr('status', DirectusStatus.Published)
  .attr('type', PackType.Free)
  .attr('allow_bid_expiration', false)
  .attr('one_pack_per_customer', false)
  .attr(
    'translations',
    ['title', 'subtitle', 'body'],
    (title, subtitle, body) => [
      {
        language_code: DEFAULT_LOCALE,
        title,
        subtitle,
        body,
      },
    ]
  )

export const packFactory = Factory.define<Pack>('Pack')
  .sequence('id', () => v4())
  .option('template', () => packTemplateFactory.build())
  .attr('createdAt', () => new Date().toISOString())
  .attr('updatedAt', () => new Date().toISOString())
  .attr('claimedAt', null)
  .attr('ownerId', null)
  .attr('redeemCode', null)
  .attr('templateId', ['template'], (template) => template.id)

export const collectibleFactory = Factory.define<Collectible>('Collectible')
  .sequence('id', () => v4())
  .option('template', () => collectibleTemplateFactory.build())
  .attr('createdAt', () => new Date().toISOString())
  .attr('updatedAt', () => new Date().toISOString())
  .attr('address', null)
  .attr('creationTransactionId', null)
  .attr('claimedAt', null)
  .attr('edition', 1)
  .attr('latestTransferTransactionId', null)
  .attr('ownerId', null)
  .attr('packId', null)
  .attr('templateId', ['template'], (template) => template.id)

// #endregion

// #region Helpers

export async function createUserAccount(
  knex: Knex,
  {
    email,
    externalId,
    username,
    status = AlgorandTransactionStatus.Pending,
  }: Pick<UserAccount, 'email' | 'username' | 'externalId'> & {
    status?: AlgorandTransactionStatus
  }
) {
  const algorandAccountTransaction = algorandTransactionFactory.build({
    status,
  })
  const algorandAccount = algorandAccountFactory.build({
    creationTransactionId: algorandAccountTransaction.id,
  })
  const userAccount = userAccountFactory.build({
    algorandAccountId: algorandAccount.id,
    email,
    externalId,
    username,
  })

  await knex('AlgorandTransaction').insert(algorandAccountTransaction)
  await knex('AlgorandAccount').insert(algorandAccount)
  await knex('UserAccount').insert(userAccount)

  return {
    algorandAccount,
    userAccount,
    algorandAccountTransaction,
  }
}

export async function createPackWithCollectibles(
  knex: Knex,
  {
    count,
    ownerId,
    redeemCode,
  }: {
    redeemCode?: string
    count: number
    ownerId?: string
  }
) {
  const pack = packFactory.build({
    claimedAt: ownerId ? new Date().toISOString() : null,
    ownerId,
    redeemCode,
  })
  const collectibleCreateTransactions = algorandTransactionFactory.buildList(
    count,
    {
      status: AlgorandTransactionStatus.Confirmed,
    }
  )
  const collectibleTransferTransactions = algorandTransactionFactory.buildList(
    count,
    {
      status: AlgorandTransactionStatus.Confirmed,
    }
  )
  const collectibles = collectibleFactory.buildList(count, {
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

// #endregion

// export async function seed(knex: Knex): Promise<void> {
export async function seed(): Promise<void> {
  // const { userAccount } = await createUserAccount(knex, {
  //   email: 'one@test.local',
  //   externalId: 'one',
  //   username: 'one',
  //   status: AlgorandTransactionStatus.Confirmed,
  // })
  // await createPackWithCollectibles(knex, {
  //   count: 3,
  //   ownerId: userAccount.id,
  // })
  // await createPackWithCollectibles(knex, {
  //   count: 3,
  // })
  // await createPackWithCollectibles(knex, {
  //   count: 3,
  //   redeemCode: 'TEST1234ABCD',
  // })
}
