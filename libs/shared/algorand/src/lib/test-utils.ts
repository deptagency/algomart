import algosdk, { SuggestedParams } from 'algosdk'
import HTTPClient from 'algosdk/dist/types/src/client/client'
import Compile from 'algosdk/dist/types/src/client/v2/algod/compile'
import PendingTransactionInformation from 'algosdk/dist/types/src/client/v2/algod/pendingTransactionInformation'
import SuggestedParamsRequest from 'algosdk/dist/types/src/client/v2/algod/suggestedParams'
import LookupAccountByID from 'algosdk/dist/types/src/client/v2/indexer/lookupAccountByID'
import JSONRequest from 'algosdk/dist/types/src/client/v2/jsonrequest'
import { fn } from 'jest-mock'

const mockJSONRequest: Omit<JSONRequest, 'do'> = {
  c: {} as unknown as HTTPClient,
  intDecoding: algosdk.IntDecoding.DEFAULT,
  path: fn(),
  prepare: fn(),
  setIntDecoding: fn(),
  query: {},
}

export function createGetTransactionParamsMock(
  params: Partial<SuggestedParams> = {}
) {
  return fn(
    (): SuggestedParamsRequest =>
      ({
        ...mockJSONRequest,
        do: fn(() =>
          Promise.resolve<SuggestedParams>({
            genesisHash: 'SGO1GKSzyE7IEPItTxCByw9x8FmnrCDexi9/cOUJOiI=',
            genesisID: 'testnet-v1.0',
            firstRound: 1000,
            lastRound: 2000,
            fee: 1000,
            ...params,
          })
        ),
      } as unknown as SuggestedParamsRequest)
  )
}

export function createCompileMock(compiled: Record<string, unknown>) {
  return fn(
    (source: string): Compile =>
      ({
        ...mockJSONRequest,
        source,
        do: fn(() => Promise.resolve(compiled)),
      } as unknown as Compile)
  )
}

export function createLookupAccountByIDMock(data: Record<string, unknown>) {
  return fn(
    (account: string): LookupAccountByID =>
      ({
        ...mockJSONRequest,
        account,
        do: fn(() => Promise.resolve({ account: data })),
      } as unknown as LookupAccountByID)
  )
}

export function createGetPendingTransactionInformationMock(
  data: Record<string, unknown>
) {
  return fn(
    (txid: string): PendingTransactionInformation =>
      ({
        txid,
        do: fn(() => Promise.resolve(data)),
      } as unknown as PendingTransactionInformation)
  )
}

export function configureAlgod() {
  // Configure a valid algod instance
  // Though we will be mocking any responses from it as needed
  return new algosdk.Algodv2(
    '',
    'https://node.testnet.algoexplorerapi.io/v2',
    ''
  )
}

export function configureIndexer() {
  // Configure a valid indexer instance
  // Though we will be mocking any responses from it as needed
  return new algosdk.Indexer('', 'https://algoindexer.algoexplorerapi.io', '')
}
