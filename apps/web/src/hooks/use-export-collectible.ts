import { useCallback, useMemo, useRef, useState } from 'react'

import { Environment } from '../environment'

import { AlgorandAdapter, IConnector } from '@/libs/algorand-adapter'
import { WalletConnectAdapter } from '@/libs/wallet-connect-adapter'
import collectibleService from '@/services/collectible-service'

const algorand = new AlgorandAdapter(Environment.chainType)

export function useExportCollectible(passphrase: string) {
  const [connected, setConnected] = useState(false)
  const [accounts, setAccounts] = useState([])
  const [selectedAccount, selectAccount] = useState('')
  const connectorReference = useRef<IConnector>()

  const connect = useCallback(async () => {
    setConnected(false)

    const connector = (connectorReference.current = new WalletConnectAdapter(
      algorand
    ))

    connector.subscribe('update_accounts', (accounts: string[]) => {
      setAccounts(accounts)
      setConnected(true)
    })

    await connector.connect()
  }, [])

  const disconnect = useCallback(async () => {
    if (connectorReference.current) {
      await connectorReference.current.disconnect()
    }
  }, [])

  const exportCollectible = useCallback(
    async (assetIndex: number) => {
      const connector = connectorReference.current
      if (!connector) return

      const hasOptedIn = await algorand.hasOptedIn(selectedAccount, assetIndex)
      if (!hasOptedIn) {
        const txn = await algorand.makeAssetOptInTransaction(
          assetIndex,
          selectedAccount
        )
        await connector.signTransaction(txn)
        await algorand.waitForConfirmation(txn.txID())
      }

      if (!passphrase) return

      const txId = await collectibleService.exportCollectible(
        assetIndex,
        selectedAccount,
        passphrase
      )

      await algorand.waitForConfirmation(txId)
    },
    [passphrase, selectedAccount]
  )

  const hasOptedIn = useCallback(
    async (assetIndex: number) => {
      return await algorand.hasOptedIn(selectedAccount, assetIndex)
    },
    [selectedAccount]
  )

  return useMemo(
    () => ({
      accounts,
      setAccounts,
      selectedAccount,
      selectAccount,
      connect,
      connected,
      exportCollectible,
      hasOptedIn,
      disconnect,
    }),
    [
      accounts,
      connect,
      connected,
      disconnect,
      exportCollectible,
      hasOptedIn,
      selectedAccount,
    ]
  )
}
