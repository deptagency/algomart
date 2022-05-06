import { stringify } from 'query-string'

export const urls = {
  // Main pages
  adminTransactions: '/admin/transactions',
  adminTransaction: '/admin/transactions/:transactionId',
  checkout: '/checkout',
  checkoutPack: '/checkout/:packSlug',
  checkoutPackWithMethod: '/checkout/:packSlug/:method',
  home: '/',
  myCollectibles: '/my/collectibles',
  myCollection: '/my/collections/:collectionSlug',
  myCollections: '/my/collections',
  myProfile: '/my/profile',
  myProfilePaymentMethods: '/my/profile/payment-methods',
  myProfilePaymentMethodsAdd: '/my/profile/payment-methods/add',
  myProfileSecurity: '/my/profile/security',
  myProfileSetup: '/my/profile/setup',
  myProfileTransactions: '/my/profile/transactions',
  myProfileImportNFT: '/my/profile/import-nft',
  mySet: '/my/sets/:setSlug',
  myShowcase: '/my/showcase',
  nft: '/nft/:assetId',
  nftDetails: '/nft/:assetId/details',
  nftActivity: '/nft/:assetId/activity',
  nftSell: '/nft/:assetId/sell',
  nftTransfer: '/nft/:assetId/transfer',
  nftInitiateTransfer: '/nft/:assetId/initiate-transfer',
  packOpening: '/pack-opening/:packId',
  paymentFailure: '/payments/failure',
  paymentSuccess: '/payments/success',
  redeem: '/redeem',
  release: '/releases/:packSlug',
  releases: '/releases',

  // Auth-related
  login: '/login',
  loginEmail: '/login-email',
  profileShowcase: '/profile/:username',
  resetPassword: '/reset-password',
  signUp: '/signup',

  // Legal
  communityGuidelines: '#',
  privacyPolicy: '#',
  termsAndConditions: '#',

  // Admin
  admin: {
    index: '/admin',
    transactions: '/admin/transactions',
    transaction: '/admin/transactions/:transactionId',
    users: '/admin/users',
  },

  api: {
    v1: {
      admin: {
        getPaymentsForBankAccount:
          '/api/v1/payments/get-payments-by-bank-account',
        getPayments: '/api/v1/payments/list-payments',
        getUsers: '/api/v1/admin/list-users',
        revokePack: '/api/v1/asset/revoke',
        updatePayment: '/api/v1/payments/update-payment',
      },
      addToShowcase: '/api/v1/collection/add-showcase',
      adminGetClaims: '/api/v1/admin/get-claims',
      adminUpdateClaims: '/api/v1/admin/update-claims',
      asset: '/api/v1/asset',
      assetClaim: '/api/v1/asset/claim',
      assetMint: '/api/v1/asset/mint',
      assetRedeem: '/api/v1/asset/redeem',
      assetTransfer: '/api/v1/asset/transfer',
      createBankAccount: '/api/v1/payments/create-bank-account',
      createBidForPack: '/api/v1/bid/add-to-pack',
      createCard: '/api/v1/payments/create-card',
      createPayment: '/api/v1/payments/create-payment',
      createTransfer: '/api/v1/payments/create-transfer-payment',
      initializeExportCollectible: '/api/v1/asset/export',
      exportCollectible: '/api/v1/asset/export/sign',
      initializeImportCollectible: '/api/v1/asset/import',
      importCollectible: '/api/v1/asset/import/sign',
      getAllCollections: '/api/v1/collection/get-all-collections',
      getAssetsByAlgoAddress: '/api/v1/asset/get-by-algo-address',
      getAssetsByOwner: '/api/v1/asset/get-by-owner',
      getBankAccountInstructions:
        '/api/v1/payments/get-bank-account-instructions',
      getBankAccountStatus: '/api/v1/payments/get-bank-account-status',
      getCardsByOwner: '/api/v1/payments/get-cards-by-owner',
      getCardStatus: '/api/v1/payments/get-card-status',
      getCountries: '/api/v1/payments/get-countries',
      getCurrencyConversion: '/api/v1/i18n/get-currency-conversion',
      getCurrencyConversions: '/api/v1/i18n/get-currency-conversions',
      getI18nInfo: '/api/v1/i18n/get-i18n-info',
      getLanguages: '/api/v1/i18n/get-languages',
      getPayment: '/api/v1/payments/get-payment',
      getPublishedPacks: '/api/v1/pack/get-published-packs',
      getRedeemable: '/api/v1/asset/get-redeemable',
      getTransfer: '/api/v1/payments/get-transfer-payment',
      getUntransferredPacks: '/api/v1/pack/untransferred',
      profile: '/api/v1/profile',
      publicKey: '/api/v1/payments/public-key',
      removeCard: '/api/v1/payments/remove-card',
      showcaseCollectible: '/api/v1/collection/collectibles-showcase',
      updateCard: '/api/v1/payments/update-card',
      updateCurrency: '/api/v1/profile/update-currency',
      updateEmail: '/api/v1/profile/update-email',
      updateLanguage: '/api/v1/profile/update-language',
      updateUsername: '/api/v1/profile/update-username',
      verifyPassphrase: '/api/v1/profile/verify-passphrase',
      verifyUsername: '/api/v1/profile/verify-username',
    },
  } as const,
} as const

/**
 * Interpolates params into the given path.
 * eg:
 *   urlFor('/:foo/:bar', { foo: 'foo', bar: 'bar' }) => '/foo/bar'
 *   urlFor(urls.nft, { assetId: 123 }) => '/nft/123'
 */
export function urlFor(path: string, params?: object, query?: object) {
  return (
    Object.keys(params).reduce(
      (accumulator, key) => accumulator.replace(`:${key}`, String(params[key])),
      path
    ) + (query ? `?${stringify(query)}` : '')
  )
}

/**
 * Verifies if path1 and path2 are matching the first "directory". For example,
 * `/collections/some-collection` and `/collections` will match while `/set` and
 * `/collections/collection` will not match.
 * @param path1 A path to check
 * @param path2 Another path to check
 */
export function isRootPathMatch(path1: string, path2: string) {
  // Note: no path-matching needed for profile-related items
  if (path1.includes(urls.myProfile)) return false

  return path1
    .split('/')[1]
    .toLowerCase()
    .includes(path2.split('/')[1].toLowerCase())
}

/**
 * Compares path1 and path2 and determines if they have matching query parameters.
 * @param path1 1st path to check
 * @param path2 2nd path to compare with
 */
export function isMatchingQueryParams(path1: string, path2: string) {
  const queryParams1 = path1.split('?')[1]
  const queryParams2 = path2.split('?')[1]

  // If neither path contains query params, they match
  if (!queryParams1 && !queryParams2) return true

  // If the characters don't match, they're not the same
  if (
    !queryParams1 ||
    !queryParams2 ||
    queryParams1.length !== queryParams2.length
  )
    return false

  // Sort query params and compare
  const queryPairs1 = queryParams1.split('&').sort()
  const queryPairs2 = queryParams2.split('&').sort()

  if (JSON.stringify(queryPairs1) !== JSON.stringify(queryPairs2)) return false

  return true
}
