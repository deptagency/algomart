import {
  AlgorandAccount,
  AlgorandTransaction,
  AlgorandTransactionGroup,
  AlgorandTransactionStatus,
  CirclePaymentCardNetwork,
  CirclePaymentVerificationOptions,
  CircleTransferStatus,
  CircleWireBankAccountStatus,
  Collectible,
  CollectibleListingModelSchema,
  CollectibleListingStatus,
  DEFAULT_CURRENCY,
  DEFAULT_LANG,
  DirectusCollectibleTemplate,
  DirectusFile,
  DirectusPackTemplate,
  DirectusRarity,
  DirectusStatus,
  IPFSStatus,
  Pack,
  PackCollectibleDistribution,
  PackCollectibleOrder,
  PackType,
  PaymentCard,
  PaymentCardStatus,
  PaymentStatus,
  Simplify,
  UserAccount,
  UserAccountProvider,
  UserAccountStatus,
  UserAccountTransfer,
} from '@algomart/schemas'
import { PaymentModel, WireBankAccountModel } from '@algomart/shared/models'
import { encrypt } from '@algomart/shared/utils'
import { Static } from '@sinclair/typebox'
import { randomInt } from 'node:crypto'
import { Factory } from 'rosie'
import { v4 } from 'uuid'

import { fakeAddressFor } from '../../mocks/algorand-adapter'

// copied default value from apps/api/src/configuration/index.ts
const SECRET_MOCK = 'fCtUCXv6ATjqbxayeAEPs5Du47hH0OcB'

export function fakeFirebaseId() {
  const characters =
    'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
  const length = 28
  return Array.from(
    { length },
    () => characters[randomInt(0, characters.length - 1)]
  ).join('')
}

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
  .attr(
    'encodedSignedTransaction',
    ['id'],
    (id) => `signed-transaction-data-${id}`
  )

export const algorandTransactionGroupFactory =
  Factory.define<AlgorandTransactionGroup>('AlgorandTransactionGroup')
    .sequence('id', () => v4())
    .attr('createdAt', () => new Date().toISOString())
    .attr('updatedAt', () => new Date().toISOString())

export const algorandAccountFactory = Factory.define<AlgorandAccount>(
  'AlgorandAccount'
)
  .sequence('id', () => v4())
  .option('creationTransaction', () => algorandTransactionFactory.build())
  .option('mnemonic', 'secret mnemonic')
  .attr('address', () => fakeAddressFor('account'))
  .attr('createdAt', () => new Date().toISOString())
  .attr('updatedAt', () => new Date().toISOString())
  .attr(
    'creationTransactionId',
    ['creationTransaction'],
    (creationTransaction) => creationTransaction.id
  )
  .attr('encryptedKey', ['mnemonic'], (mnemonic) =>
    encrypt(mnemonic, SECRET_MOCK)
  )

export const userAccountFactory = Factory.define<UserAccount>('UserAccount')
  .sequence('id', () => v4())
  .attr('age', null)
  .option('algorandAccount', () => algorandAccountFactory.build())
  .attr(
    'algorandAccountId',
    ['algorandAccount'],
    (algorandAccount) => algorandAccount.id
  )
  .attr('balance', () => 0)
  .attr('currency', () => DEFAULT_CURRENCY)
  .attr('createdAt', () => new Date().toISOString())
  .attr('email', ['username'], (username) => `${username}@test.local`)
  .attr('externalId', () => fakeFirebaseId())
  .attr('email', ['username'], (username) => `${username}@test.local`)
  .attr('age', null)
  .attr('applicantId', null)
  .attr('lastWorkflowRunId', null)
  .attr('verificationStatus', () => UserAccountStatus.Unverified)
  .attr('lastVerified', () => new Date().toISOString())
  .attr('recentWatchlistBreakdown', null)
  .attr('language', () => DEFAULT_LANG)
  .attr('provider', UserAccountProvider.Email)
  .attr('updatedAt', () => new Date().toISOString())
  .attr('username', () => 'test')
  .attr('watchlistMonitorId', null)

export const rarityFactory = Factory.define<DirectusRarity>('DirectusRarity')
  .sequence('id', () => v4())
  .option('name', 'Test Rarity')
  .option('description', 'Test Rarity Decription')
  .attr('code', 'RR')
  .attr('color', '#FF0000')
  .attr('translations', ['name', 'description'], (name, description) => [
    {
      languages_code: DEFAULT_LANG,
      name,
      description,
    },
  ])

export const collectibleTemplateFactory =
  Factory.define<DirectusCollectibleTemplate>('DirectusCollectibleTemplate')
    .sequence('id', () => v4())
    .option('title', 'Test Collectible')
    .option('subtitle', 'Test Collectible Subtitle')
    .option('body', 'Test Collectible Body')
    .attr('pack_template', () => packTemplateFactory.build())
    .attr('preview_image', () => fileFactory.build())
    .attr('rarity', () => rarityFactory.build())
    .attr('status', DirectusStatus.Published)
    .attr('total_editions', 10)
    .attr('unique_code', 'CODE0000')
    .attr(
      'translations',
      ['title', 'subtitle', 'body'],
      (title, subtitle, body) => [
        {
          languages_code: DEFAULT_LANG,
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
  .attr('pack_image', () => fileFactory.build())
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
        languages_code: DEFAULT_LANG,
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
  .attr('assetMetadataHash', 'abc')
  .attr('assetUrl', 'abc')
  .attr('ipfsStatus', IPFSStatus.Stored)

export const fileFactory = Factory.define<DirectusFile>('DirectusFile')
  .sequence('id', () => v4())
  .option('filename_disk', 'abc.jpg')
  .option('storage', 'local')
  .option('title', 'Test File Title')
  .option('subtitle', 'Test File Subtitle')

export const paymentFactory = Factory.define<PaymentModel>('Payment')
  .sequence('id', () => v4())
  .attr('payerId', null)
  .attr('paymentCardId', null)
  .attr('externalId', null)
  .attr('status', PaymentStatus.Pending)
  .attr('error', null)
  .attr('transferId', null)
  .attr('destinationAddress', null)
  .attr('createdAt', () => new Date().toISOString())
  .attr('updatedAt', () => new Date().toISOString())
  .attr('payload', {
    keyId: 'key1',
    amount: '10000',
    cardId: v4(),
    metadata: { email: 'test@test.com', ipAddress: '::1' },
    description: 'Purchase of 100.00 credits',
    verification: CirclePaymentVerificationOptions.cvv,
    encryptedData: 'TEST_ENCRYPTED_VALUE',
    userExternalId: v4(),
  } as PaymentModel['payload'])
  .attr('idempotencyKey', v4())
  .attr('retryPayload', null)
  .attr('retryIdempotencyKey', null)
  .attr('amount', () => '10000')
  .attr('fees', () => '0')
  .attr('total', () => '10000')

export const paymentCardFactory = Factory.define<PaymentCard>('PaymentCard')
  .sequence('id', () => v4())
  .attr('ownerId', null)
  .attr('externalId', () => v4())
  .attr('network', CirclePaymentCardNetwork.AMEX)
  .attr('lastFour', '0000')
  .attr('expirationMonth', '12')
  .attr('expirationYear', '2025')
  .attr('status', PaymentCardStatus.Complete)
  .attr('countryCode', 'US')
  .attr('error', null)
  .attr('createdAt', () => new Date().toISOString())
  .attr('updatedAt', () => new Date().toISOString())

export const userAccountTransferFactory = Factory.define<UserAccountTransfer>(
  'UserAccountTransfer'
)
  .sequence('id', () => v4())
  .attr('userAccountId', null)
  .attr('amount', '1000')
  .attr('balance', null)
  .attr('entityId', null)
  .attr('entityType', null)
  .attr('externalId', () => v4())
  .attr('status', CircleTransferStatus.Pending)
  .attr('error', null)
  .attr('createdAt', () => new Date().toISOString())
  .attr('updatedAt', () => new Date().toISOString())

export const collectibleListingsModelFactory = Factory.define<
  Simplify<Static<typeof CollectibleListingModelSchema>>
>('CollectibleListingsModel')
  .sequence('id', () => v4())
  .attr('createdAt', () => new Date().toISOString())
  .attr('updatedAt', () => new Date().toISOString())
  .attr('sellerId', null)
  .attr('buyerId', null)
  .attr('price', 0)
  .attr('collectibleId', null)
  .attr('type', null)
  .attr('status', CollectibleListingStatus.Active)

export const wireBankAccountFactory = Factory.define<WireBankAccountModel>(
  'WireBankAccount'
)
  .sequence('id', () => v4())
  .attr('createdAt', () => new Date().toISOString())
  .attr('updatedAt', () => new Date().toISOString())
  .attr('externalId', () => v4())
  .attr('fingerprint', () => v4())
  .attr('trackingRef', '3EFDG87456')
  .attr('description', 'WELLS FARGO BANK, NA ****0010')
  .attr('idempotencyKey', () => v4())
  .attr('accountNumber', '12340010')
  .attr('routingNumber', '121000248')
  .attr('iban', null)
  .attr('ownerId', null)
  .attr('default', false)
  .attr('isSaved', false)
  .attr('billingDetails', {
    name: 'Satoshi Nakamoto',
    line1: '100 Money Street',
    line2: 'Suite 1',
    city: 'Boston',
    postalCode: '01234',
    district: 'MA',
    country: 'US',
  })
  .attr('bankAddress', {
    bankName: 'WELLS FARGO BANK, NA',
    line1: '100 Money Street',
    line2: 'Suite 1',
    city: 'SAN FRANCISCO',
    district: 'CA',
    country: 'US',
  })
  .attr('status', CircleWireBankAccountStatus.Pending)
  .attr('error', null)
  .attr('riskEvaluation', null)
