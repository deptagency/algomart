export const urls = {
  // Main pages
  home: '/',
  myCollectibles: '/my/collectibles',
  myCollections: '/my/collections',
  myCollection: '/my/collections/:collectionSlug',
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
  releases: '/releases',
  release: '/releases/:packSlug',

  // Auth-related
  login: '/login',
  loginEmail: '/login-email',
  signUp: '/signup',
  profileShowcase: '/profile/:username',
  resetPassword: '/reset-password',

  api: {
    v1: {
      addToShowcase: '/api/v1/collection/add-showcase',
      asset: '/api/v1/asset',
      assetClaim: '/api/v1/asset/claim',
      assetRedeem: '/api/v1/asset/redeem',
      assetTransfer: '/api/v1/asset/transfer',
      createBidForPack: 'api/v1/bid/add-to-pack',
      createCard: '/api/v1/payments/create-card',
      createPayment: '/api/v1/payments/create-payment',
      getAllCollections: '/api/v1/collection/get-all-collections',
      getAssetsByOwner: '/api/v1/asset/get-by-owner',
      getCardStatus: '/api/v1/payments/get-card-status',
      getCardsByOwner: '/api/v1/payments/get-cards-by-owner',
      getPayment: '/api/v1/payments/get-payment',
      getPublishedPacks: '/api/v1/pack/get-published-packs',
      getRedeemable: '/api/v1/asset/get-redeemable',
      profile: '/api/v1/profile',
      publicKey: '/api/v1/payments/public-key',
      removeCard: '/api/v1/payments/remove-card',
      updateCard: '/api/v1/payments/update-card',
      updateEmail: '/api/v1/profile/update-email',
      updateUsername: '/api/v1/profile/update-username',
      verifyPassphrase: '/api/v1/profile/verify-passphrase',
      verifyUsername: '/api/v1/profile/verify-username',
      showcaseCollectible: '/api/v1/collection/collectibles-showcase',
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
