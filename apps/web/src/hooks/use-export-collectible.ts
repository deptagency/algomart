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
  const [exportStatus, setExportStatus] = useState<
    'idle' | 'opt-in' | 'opting-in' | 'pending' | 'success' | 'error'
  >('idle')
  const connectorReference = useRef<IConnector>()

  const connect = useCallback(async () => {
    setConnected(false)

    const connector = (connectorReference.current = new WalletConnectAdapter(
      algorand
    ))

    connector.subscribe('update_accounts', (accounts: string[]) => {
      setAccounts(accounts)
      selectAccount(accounts[0])
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
      try {
        setExportStatus('idle')
        const connector = connectorReference.current
        if (!connector || !passphrase) return

        const hasOptedIn = await algorand.hasOptedIn(
          selectedAccount,
          assetIndex
        )
        if (!hasOptedIn) {
          setExportStatus('opting-in')
          const txn = await algorand.makeAssetOptInTransaction(
            assetIndex,
            selectedAccount
          )
          await connector.signTransaction(txn)
          setExportStatus('opt-in')
          await algorand.waitForConfirmation(txn.txID())
        }

        setExportStatus('pending')
        const txId = await collectibleService.exportCollectible(
          assetIndex,
          selectedAccount,
          passphrase
        )

        await algorand.waitForConfirmation(txId)
        setExportStatus('success')
      } catch (error) {
        setExportStatus('error')
        throw error
      }
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
      connect,
      connected,
      disconnect,
      exportCollectible,
      exportStatus,
      hasOptedIn,
      selectAccount,
      selectedAccount,
      setAccounts,
    }),
    [
      accounts,
      connect,
      connected,
      disconnect,
      exportCollectible,
      exportStatus,
      hasOptedIn,
      selectedAccount,
    ]
  )
}
