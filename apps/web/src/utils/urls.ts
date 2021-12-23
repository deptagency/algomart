export const urls = {
  // Main pages
  checkout: '/checkout',
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
  mySet: '/my/sets/:setSlug',
  myShowcase: '/my/showcase',
  packOpening: '/pack-opening/:packId',
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

  api: {
    v1: {
      addToShowcase: '/api/v1/collection/add-showcase',
      asset: '/api/v1/asset',
      assetClaim: '/api/v1/asset/claim',
      assetMint: '/api/v1/asset/mint',
      assetRedeem: '/api/v1/asset/redeem',
      assetTransfer: '/api/v1/asset/transfer',
      createBankAccount: '/api/v1/payments/create-bank-account',
      createBidForPack: 'api/v1/bid/add-to-pack',
      createCard: '/api/v1/payments/create-card',
      createPayment: '/api/v1/payments/create-payment',
      getAllCollections: '/api/v1/collection/get-all-collections',
      getAssetsByAlgoAddress: '/api/v1/asset/get-by-algo-address',
      getAssetsByOwner: '/api/v1/asset/get-by-owner',
      getBankAccountInstructions:
        '/api/v1/payments/get-bank-account-instructions',
      getBankAccountStatus: '/api/v1/payments/get-bank-account-status',
      getCardsByOwner: '/api/v1/payments/get-cards-by-owner',
      getCardStatus: '/api/v1/payments/get-card-status',
      getPayment: '/api/v1/payments/get-payment',
      getPublishedPacks: '/api/v1/pack/get-published-packs',
      getRedeemable: '/api/v1/asset/get-redeemable',
      getUntransferredPacks: '/api/v1/pack/untransferred',
      profile: '/api/v1/profile',
      getLegacyAccount: '/api/v1/profile/get-legacy-account',
      publicKey: '/api/v1/payments/public-key',
      removeCard: '/api/v1/payments/remove-card',
      showcaseCollectible: '/api/v1/collection/collectibles-showcase',
      updateCard: '/api/v1/payments/update-card',
      updateEmail: '/api/v1/profile/update-email',
      updateUsername: '/api/v1/profile/update-username',
      verifyPassphrase: '/api/v1/profile/verify-passphrase',
      verifyUsername: '/api/v1/profile/verify-username',
    },
  } as const,
} as const

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
