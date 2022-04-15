/**
 * ARC-2 pattern for dApp name
 * @see https://github.com/algorandfoundation/ARCs/blob/main/ARCs/arc-0002.md
 */
export const ARC2_DAPP_NAME_PATTERN = /^[a-zA-Z0-9][a-zA-Z0-9_/@.-]{4,31}$/

/**
 * Default dApp name to use for notes etc
 */
export const DEFAULT_DAPP_NAME = 'AlgoMart/v1'

/**
 * Default number of additional rounds transactions are valid for
 */
export const DEFAULT_ADDITIONAL_ROUNDS = 0

/**
 * Default initial balance for new accounts
 */
export const DEFAULT_INITIAL_BALANCE = 100_000

/**
 * Max number of NFTs that can be created at once
 */
export const MAX_NFT_COUNT = 16
