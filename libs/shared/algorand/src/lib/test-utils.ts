import algosdk, { SuggestedParams } from 'algosdk'
import HTTPClient from 'algosdk/dist/types/src/client/client'
import Compile from 'algosdk/dist/types/src/client/v2/algod/compile'
import SuggestedParamsRequest from 'algosdk/dist/types/src/client/v2/algod/suggestedParams'
import { fn } from 'jest-mock'

export function createGetTransactionParamsMock(
  params: Partial<SuggestedParams> = {}
) {
  return fn(
    (): SuggestedParamsRequest => ({
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
      path: fn(),
      prepare: fn(),
      setIntDecoding: fn(),
      c: {} as unknown as HTTPClient,
      intDecoding: algosdk.IntDecoding.DEFAULT,
      query: {},
    })
  )
}

export function createCompileMock(compiled: Record<string, unknown>) {
  return fn((source) => {
    const obj = {
      source,
      c: {} as unknown as HTTPClient,
      intDecoding: algosdk.IntDecoding.DEFAULT,
      query: {},
      path: fn(),
      prepare: fn(),
      setIntDecoding: fn(),
      do: fn(() => Promise.resolve(compiled)),
    }

    return obj as unknown as Compile
  })
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
