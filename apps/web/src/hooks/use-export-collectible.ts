import { useCallback, useMemo, useRef, useState } from 'react'

import { Environment } from '../environment'

import { AlgorandAdapter, IConnector } from '@/libs/algorand-adapter'
import { WalletConnectAdapter } from '@/libs/wallet-connect-adapter'
import collectibleService from '@/services/collectible-service'

const algorand = new AlgorandAdapter(Environment.chainType)

export function useExportCollectible() {
  const [connected, setConnected] = useState(false)
  const [account, setAccount] = useState('')
  const connectorReference = useRef<IConnector>()

  const connect = useCallback(async () => {
    setConnected(false)

    const connector = (connectorReference.current = new WalletConnectAdapter(
      algorand
    ))

    connector.subscribe('update_accounts', (accounts: string[]) => {
      setAccount(accounts[0])
      setConnected(true)
    })

    await connector.connect()
  }, [])

  const exportCollectible = useCallback(
    async (assetIndex: number) => {
      const connector = connectorReference.current
      if (!connector) return

      const hasOptedIn = await algorand.hasOptedIn(account, assetIndex)
      if (!hasOptedIn) {
        const txn = await algorand.makeAssetOptInTransaction(
          assetIndex,
          account
        )
        const signedTxn = await connector.signTransaction(txn)
        const txId = await algorand.sendRawTransaction(signedTxn)
        await algorand.waitForConfirmation(txId)
      }

      const passphrase = prompt('Enter your passphrase')
      if (!passphrase) return

      await collectibleService.exportCollectible(
        assetIndex,
        account,
        passphrase
      )
    },
    [account]
  )

  const hasOptedIn = useCallback(
    async (assetIndex: number) => {
      return await algorand.hasOptedIn(account, assetIndex)
    },
    [account]
  )

  return useMemo(
    () => ({
      account,
      connect,
      connected,
      exportCollectible,
      hasOptedIn,
    }),
    [account, connect, connected, exportCollectible, hasOptedIn]
  )
}
