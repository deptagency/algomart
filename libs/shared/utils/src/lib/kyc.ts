/**
 * Determines if a purchase should be restricted and therefore subjected to KYC verification
 * @param userDaily The amount spent in the last 24 hours
 * @param userTotal The amount spent over life of the account
 * @param amount An additional amount
 * @returns
 */
export function isRestrictedPurchase(
  userDaily: number,
  userTotal: number,
  amount?: string | number | bigint
): {
  isRestricted: boolean
  dailyAmountBeforeVerification: number
  totalAmountBeforeVerification: number
} {
  // Constants dictated by Circle
  const dailyHighLimitInt = 200000 // eslint-disable-line unicorn/numeric-separators-style
  const totalHighLimitInt = 1000000 // eslint-disable-line unicorn/numeric-separators-style

  // Calculate amount remaining before KYC verification is required
  const paymentAmount = amount ? Number(amount) : 0
  const dailyHighWithPurchaseAccountedFor = dailyHighLimitInt - paymentAmount
  const totalHighWithPurchaseAccountedFor = totalHighLimitInt - paymentAmount

  // Determine if the daily/total limits have been hit
  const doesHitDailyLimit = userDaily > dailyHighWithPurchaseAccountedFor
  const doesHitTotalLimit = userTotal > totalHighWithPurchaseAccountedFor
  return {
    isRestricted: doesHitDailyLimit || doesHitTotalLimit,
    dailyAmountBeforeVerification:
      dailyHighWithPurchaseAccountedFor - userDaily,
    totalAmountBeforeVerification:
      totalHighWithPurchaseAccountedFor - userTotal,
  }
}
