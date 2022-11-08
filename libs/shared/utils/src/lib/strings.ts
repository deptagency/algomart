/**
 *
 * @see https://github.com/bryc/code/blob/master/jshash/experimental/cyrb53.js
 * @param {string} string
 * @param {number} seed
 */
function cyrb53(string: string, seed = 0): number {
  let h1 = 0xde_ad_be_ef ^ seed,
    h2 = 0x41_c6_ce_57 ^ seed

  for (let index = 0, ch: number; index < string.length; index++) {
    ch = string.codePointAt(index)
    h1 = Math.imul(h1 ^ ch, 2_654_435_761)
    h2 = Math.imul(h2 ^ ch, 1_597_334_677)
  }

  h1 =
    Math.imul(h1 ^ (h1 >>> 16), 2_246_822_507) ^
    Math.imul(h2 ^ (h2 >>> 13), 3_266_489_909)
  h2 =
    Math.imul(h2 ^ (h2 >>> 16), 2_246_822_507) ^
    Math.imul(h1 ^ (h1 >>> 13), 3_266_489_909)

  return 4_294_967_296 * (2_097_151 & h2) + (h1 >>> 0)
}

/**
 * Computes a large number from a string.
 * @param string String to compute hash for
 * @returns Hash of a string
 */
export function hashString(string: string): number {
  return cyrb53(string)
}
