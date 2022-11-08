import { ChainalysisAdapter } from '@algomart/shared/adapters'
import { jest } from '@jest/globals'

import { MethodLikeKeys } from './jest-types'

export const defaultVerifyBlockchainFailureMockData = {
  category: 'sanctions',
  name: 'SANCTIONS: OFAC SDN Secondeye Solution 2021-04-15 qznpd2tsk0l3hwdcygud3ch4tgxjwg5ptqa93ltwj4',
  description:
    'Pakistan-based Secondeye Solution (SES), also known as Forwarderz, is a synthetic identity document vendor that was added to the OFAC SDN list in April 2021.\n \n\n SES customers could buy fake identity documents to sign up for accounts with cryptocurrency exchanges, payment providers, banks, and more under false identities. According to the US Treasury Department, SES assisted the Internet Research Agency (IRA), the Russian troll farm that OFAC designated pursuant to E.O. 13848 in 2018 for interfering in the 2016 presidential election, in concealing its identity to evade sanctions.\n \n\n https://home.treasury.gov/news/press-releases/jy0126',
  url: 'https://home.treasury.gov/news/press-releases/jy0126',
}

export function setupChainalysisAdapterMockImplementations(
  prototypeOverrides = {},
  staticOverrides = {}
) {
  const defaultStaticMocks = {}
  const staticMocks = { ...defaultStaticMocks, ...staticOverrides }
  for (const propertyName in staticMocks) {
    if (staticMocks[propertyName]) {
      jest
        .spyOn(ChainalysisAdapter, propertyName as never)
        .mockImplementation(staticMocks[propertyName])
    }
  }

  const defaultPrototypeMocks = {
    verifyBlockchainAddress: generateSuccessfulVerifyBlockchainMock,
  }
  const prototypeMocks = { ...defaultPrototypeMocks, ...prototypeOverrides }
  for (const propertyName in prototypeMocks) {
    if (prototypeMocks[propertyName]) {
      jest
        .spyOn(
          ChainalysisAdapter.prototype,
          propertyName as MethodLikeKeys<ChainalysisAdapter>
        )
        .mockImplementation(prototypeMocks[propertyName])
    }
  }
}

export async function generateSuccessfulVerifyBlockchainMock() {
  return []
}

export async function generateFailureVerifyBlockchainMock() {
  return [defaultVerifyBlockchainFailureMockData]
}

export async function generateUnknownFailureVerifyBlockchainMock() {
  return null
}
