import {
  CircleTransferCurrencyType,
  CircleTransferSourceType,
  CircleTransferStatus,
  CircleWireBankAccountStatus,
  PaymentStatus,
} from '@algomart/schemas'
import { CircleAdapter } from '@algomart/shared/adapters'
import { jest } from '@jest/globals'
import { v4 } from 'uuid'

import { MethodLikeKeys } from './jest-types'

export function setupCircleAdapterMockImplementations(
  prototypeOverrides = {},
  staticOverrides = {}
) {
  const defaultStaticMocks = {}
  const staticMocks = { ...defaultStaticMocks, ...staticOverrides }
  for (const propertyName in staticMocks) {
    if (staticMocks[propertyName]) {
      jest
        .spyOn(CircleAdapter, propertyName as never)
        .mockImplementation(staticMocks[propertyName])
    }
  }

  const defaultPrototypeMocks = {
    testConnection: jest.fn(() => Promise.resolve()),
    createPayment: successfulCreatePaymentMock,
    getMerchantWallet: successfulGetMerchantWalletMock,
    createUserWallet: generateSuccessfulCreateUserWalletMock(),
    createWalletTransfer: generateSuccessfulCreateWalletTransferMock(),
    createWireBankAccount: generateSuccessfulCreateWireBankAccountMock(),
  }
  const prototypeMocks = { ...defaultPrototypeMocks, ...prototypeOverrides }
  for (const propertyName in prototypeMocks) {
    if (prototypeMocks[propertyName]) {
      jest
        .spyOn(
          CircleAdapter.prototype,
          propertyName as MethodLikeKeys<CircleAdapter>
        )
        .mockImplementation(prototypeMocks[propertyName])
    }
  }
}

export async function successfulCreatePaymentMock({
  amount,
}: {
  amount: string
}) {
  return {
    status: PaymentStatus.Confirmed,
    externalId: v4(),
    amount,
  }
}

export async function nullResponseCreatePaymentMock() {
  return null
}

const exceptionCreatePaymentMockError = new Error('CREATE PAYMENT ERROR')
export async function exceptionCreatePaymentMock() {
  throw exceptionCreatePaymentMockError
}
exceptionCreatePaymentMock.error = exceptionCreatePaymentMockError

export const defaultCreateUserWalletMockData = {
  description: 'TEST WALLET',
  balances: [
    {
      amount: '1000000',
      currency: 'USD',
    },
  ],
  entityId: v4(),
  type: 'TEST',
  walletId: '12345678910',
}

export async function successfulGetMerchantWalletMock() {
  return { ...defaultCreateUserWalletMockData }
}

export function generateSuccessfulCreateUserWalletMock(walletData = {}) {
  return async () => ({
    ...defaultCreateUserWalletMockData,
    ...walletData,
  })
}

export function generateSuccessfulCreateWalletTransferMock(overrides = {}) {
  return async () => ({
    amount: {
      amount: '10000',
      currency: CircleTransferCurrencyType.USD,
    },
    source: {
      id: v4(),
      type: CircleTransferSourceType.wallet,
    },
    destination: {
      id: v4(),
      type: CircleTransferSourceType.wallet,
    },
    id: v4(),
    transactionHash: 'TEST',
    status: CircleTransferStatus.Pending,
    errorCode: undefined,
    createDate: new Date().toISOString(),
    walletId: '12345678910',
    ...overrides,
  })
}

export const defaultSuccessfulCreateWireBankAccountResultProps = {
  id: v4(),
  status: CircleWireBankAccountStatus.Pending,
  description: 'WELLS FARGO BANK, NA ****0010',
  trackingRef: 'CIR3UWFLS5',
  fingerprint: v4(),
  virtualAccountEnabled: false,
  createDate: '2022-08-09T13:25:46.057Z',
  updateDate: '2022-08-09T13:25:46.439Z',
}
export function generateSuccessfulCreateWireBankAccountMock(overrides = {}) {
  return async (params) => ({
    ...defaultSuccessfulCreateWireBankAccountResultProps,
    bankAddress: params.bankAddress,
    billingDetails: params.billingDetails,
    ...overrides,
  })
}

export async function badRequestCreateWireBankAccountMock() {
  return null
}
