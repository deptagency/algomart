import { calculateCreditCardFees } from './currency'

describe('Currency utils', () => {
  test('calculateCreditCardFees', () => {
    // With BigInt in US
    expect(calculateCreditCardFees(1000n, 'US')).toStrictEqual({
      amountN: 1000n,
      feesN: 61n,
      totalN: 1061n,
    })

    expect(calculateCreditCardFees(2500n, 'US')).toStrictEqual({
      amountN: 2500n,
      feesN: 106n,
      totalN: 2606n,
    })

    // With BigInt not in US
    expect(calculateCreditCardFees(1000n, 'UK')).toStrictEqual({
      amountN: 1000n,
      feesN: 72n,
      totalN: 1072n,
    })

    expect(calculateCreditCardFees(2500n, 'UK')).toStrictEqual({
      amountN: 2500n,
      feesN: 133n,
      totalN: 2633n,
    })

    // With Numbers
    expect(calculateCreditCardFees(1000, 'US')).toStrictEqual({
      amountN: 1000n,
      feesN: 61n,
      totalN: 1061n,
    })

    expect(calculateCreditCardFees(1000, 'UK')).toStrictEqual({
      amountN: 1000n,
      feesN: 72n,
      totalN: 1072n,
    })
  })
})
