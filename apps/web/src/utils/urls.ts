export const urls = {
  // Main pages
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
      createBidForPack: '/api/v1/bid/add-to-pack',
      createCard: '/api/v1/payments/create-card',
      createPayment: '/api/v1/payments/create-payment',
      createTransfer: '/api/v1/payments/create-transfer-payment',
      getAllCollections: '/api/v1/collection/get-all-collections',
      getAssetsByAlgoAddress: '/api/v1/asset/get-by-algo-address',
      getAssetsByOwner: '/api/v1/asset/get-by-owner',
      getBankAccountInstructions:
        '/api/v1/payments/get-bank-account-instructions',
      getBankAccountStatus: '/api/v1/payments/get-bank-account-status',
      getCardsByOwner: '/api/v1/payments/get-cards-by-owner',
      getCardStatus: '/api/v1/payments/get-card-status',
      getClaims: '/api/v1/admin/get-claims',
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
      updateClaims: '/api/v1/admin/update-claims',
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
