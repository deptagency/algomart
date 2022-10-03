import { stringify } from 'query-string'

export const urls = {
  // Main pages
  checkout: '/checkout',
  checkoutCollectible: '/checkout/collectible/:assetId',
  checkoutPack: '/checkout/pack/:packSlug',
  checkoutPackWithMethod: '/checkout/pack/:packSlug/:method',
  home: '/',
  betaAccess: '/beta-access',
  faqs: '/faqs',
  myCollectibles: '/my/collectibles',
  myCollection: '/my/collections/:collectionSlug',
  myCollections: '/my/collections',
  myWallet: '/my/wallet',
  myProfile: '/my/profile',
  myProfilePaymentMethods: '/my/profile/payment-methods',
  myProfilePaymentMethodsAdd: '/my/profile/payment-methods/add',
  myProfileSecurity: '/my/profile/security',
  myProfileSetup: '/my/profile/setup',
  myProfileImportNFT: '/my/profile/import-nft',
  mySet: '/my/sets/:setSlug',
  myShowcase: '/my/showcase',
  myVerification: '/my/verification',
  nft: '/nft/:assetId',
  nftDetails: '/nft/:assetId#details',
  nftActivity: '/nft/:assetId#activity',
  nftSell: '/nft/:assetId/list-for-sale',
  nftTransfer: '/nft/:assetId#transfer',
  nftInitiateTransfer: '/nft/:assetId/initiate-transfer',
  packOpening: '/pack-opening/:packId',
  paymentFailure: '/payments/failure',
  paymentSuccess: '/payments/success',
  paymentTransferPending: '/payments/pending_transfer',
  cashout: '/cashout',
  purchaseCredits: '/add-money',
  redeem: '/redeem',
  releasePack: '/drops/:packSlug',
  drops: '/drops',
  marketplace: '/marketplace',
  marketplaceListing: '/marketplace/:uniqueCode',
  settings: '/my/profile',
  about: '/about',
  support: '/support',

  // Auth-related
  login: '/login',
  loginEmail: '/login-email',
  profileShowcase: '/profile/:username',
  sendResetPassword: '/send-reset-password',
  resetPassword: '/reset-password',
  signUp: '/signup',
  signUpEmail: '/signup-email',

  // Legal
  communityGuidelines: '/community-guidelines',
  privacyPolicy: '/privacy-policy',
  termsAndConditions: '/terms-of-service',
  amlPolicy: '/aml-policy',

  api: {
    // Non-local API endpoints
    packs: {
      auctionByTemplateId: '/packs/auction/:templateId',
      byOwner: '/packs/by-owner',
      bySlug: '/packs/by-slug/:slug',
      claimFree: '/packs/claim/free',
      claimRedeem: '/packs/claim/redeem',
      redeemable: '/packs/redeemable/:redeemCode',
      search: '/packs/search',
      transferById: '/packs/transfer/:packId',
    },
    accounts: {
      base: '/accounts',
      applicant: '/accounts/applicant',
      applicantToken: '/accounts/applicant/token',
      applicantWorkflow: '/accounts/applicant/workflow',
      applicantManualReview: '/accounts/applicant/manual-review',
      avatarByUsername: '/accounts/avatar/:username',
      status: '/accounts/status',
      sendNewEmailVerification: '/accounts/send-new-email-verification',
      sendPasswordReset: '/accounts/send-password-reset',
    },
    application: {
      countries: '/application/countries',
    },
    collections: {
      base: '/collections',
    },
    collectibles: {
      activities: '/collectibles/activities',
      fetchShowcase: '/collectibles/showcase',
      search: '/collectibles/search',
      showcase: '/collectibles/showcase',
    },
    faqs: '/faqs',
    homepage: '/homepage',
    marketplace: {
      listingById: '/marketplace/listings/:listingId',
      listings: '/marketplace/listings',
      listingsDelist: '/marketplace/listings/:listingId/delist',
      listingsSearch: '/marketplace/listings/search',
      purchaseListingWithCredits: '/marketplace/listings/:listingId/purchase',
    },
    algorand: {
      getTransactionParams: '/algorand/get-transaction-params',
      lookupAccount: '/algorand/lookup-account',
      lookupAsset: '/algorand/lookup-asset',
      lookupTransaction: '/algorand/lookup-transaction',
      sendRawTransaction: '/algorand/send-raw-transaction',
    },
    payments: {
      card: '/payments/cards/:cardId',
      cardStatus: '/payments/cards/:cardId/status',
      cards: '/payments/cards',
      ccPayment: '/payments/cc-payment',
      usdcPayment: '/payments/usdc-payment',
      purchasePackWithCredits: '/payments/purchase-pack-with-credits',
      missingTransfers: '/payments/missing-transfers',
      payment: '/payments/:paymentId',
      paymentTransfer: '/payments/:paymentId/transfer',
      publicKey: '/payments/encryption-public-key',
      wallets: '/payments/wallets',
    },
    payouts: {
      usdcPayout: '/payouts/usdc',
      wirePayout: '/payouts/wire',
    },
    i18n: {
      base: '/i18n',
    },
    tags: {
      search: '/tags/search/:query',
      list: '/tags/list',
    },
    transfers: {
      byEntityId: '/user-transfers/search/entity-id/:entityId',
      getById: '/user-transfers/:id',
      search: '/user-transfers/search',
    },
    // Next.js endpoints
    // NOTE: REVISIT IF ANY OF THESE ARE ACTUALLY USED
    v1: {
      admin: {
        getProfileImageForUser: '/api/v1/admin/get-profile-image',
      },
      adminGetClaims: '/api/v1/admin/get-claims',
      adminUpdateClaims: '/api/v1/admin/update-claims',
      createPaymentWithCard: '/api/v1/payments/create-payment-with-card',
      createUsdcPayment: '/api/v1/payments/create-usdc-payment',
      initializeExportCollectible: '/api/v1/asset/export',
      exportCollectible: '/api/v1/asset/export/sign',
      initializeImportCollectible: '/api/v1/asset/import',
      importCollectible: '/api/v1/asset/import/sign',
      purchasePackWithCredits: '/api/v1/payments/purchase-pack',
      adminCreateCustomToken: '/api/v1/admin/create-custom-token',
    },
  } as const,
} as const

export const hashEvents = {
  listingAdded: '#listing-added',
  listingRemoved: '#listing-removed',
  unifiedPaymentSuccess: '#unified-payment-success',
  creditsPaymentSuccess: '#credits-payment-success',
} as const

/**
 * Interpolates params into the given path.
 * eg:
 *   urlFor('/:foo/:bar', { foo: 'foo', bar: 'bar' }) => '/foo/bar'
 *   urlFor(urls.nft, { assetId: 123 }) => '/nft/123'
 */
export function urlFor(
  path: string,
  params?: Record<string, unknown>,
  query?: Record<string, unknown>
) {
  const formattedPath = params
    ? Object.keys(params).reduce(
        (accumulator, key) =>
          accumulator.replace(
            `:${key}`,
            encodeURIComponent(String(params[key]))
          ),
        path
      )
    : path

  return formattedPath + (query ? `?${stringify(query)}` : '')
}

/**
 * Returns whether `fullPath` is a subpath of `prefixPath`
 * EXCEPTION: if prefixPath is '/' then it must match exactly
 * eg:
 *   isSubPath('/foo/bar', '/foo') => true
 *   isSubPath('/foo/bar', '/foo', ['bar']) => false
 *   isSubPath('/foo/bar', '/') => false
 *   isSubPath('/', '/') => true
 * @param fullPath The path to check.
 * @param prefixPath The root path to check against.
 * @param ignorePaths Prevent true if prefix path contains a string
 */
export function isSubPath(
  fullPath: string,
  prefixPath: string,
  ignorePaths = []
) {
  // Strip out ignored paths
  const containsIgnored = ignorePaths.some((path) => {
    return fullPath.includes(path)
  })
  if (containsIgnored) return false

  // Strip query params and trailing slash
  // Add a trailing slash to both so /some is not considered a subpath of /something
  const root = prefixPath.split('?')[0].toLowerCase().replace(/\/$/, '') + '/'
  const subpath = fullPath.split('?')[0].toLowerCase().replace(/\/$/, '') + '/'
  if (root === '/') return subpath === '/'
  return subpath.startsWith(root)
}

/**
 * Given a path like `/my/collectibles` this returns `/my`. Used to ensure the
 * main nav highlights the correct link.
 * @param path Path to extract prefix from
 * @returns The prefix if it exists or just the root path
 */
export function getPrefixPath(path?: string) {
  if (!path) return '/'
  const [prefix] = path.slice(1).split('/')
  return '/' + prefix ?? ''
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
