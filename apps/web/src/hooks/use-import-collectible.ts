import { useCallback, useMemo, useRef, useState } from 'react'

import { Environment } from '../environment'

import { AlgorandAdapter, IConnector } from '@/libs/algorand-adapter'
import { WalletConnectAdapter } from '@/libs/wallet-connect-adapter'
import collectibleService from '@/services/collectible-service'

const algorand = new AlgorandAdapter(Environment.chainType)

export type ImportStatus =
  | 'idle'
  | 'opt-in'
  | 'opting-in'
  | 'pending'
  | 'success'
  | 'error'

export function useImportCollectible(passphrase: string) {
  const [connected, setConnected] = useState(false)
  const [accounts, setAccounts] = useState([])
  const [selectedAccount, selectAccount] = useState('')
  const [importStatus, setImportStatus] = useState<ImportStatus>('idle')
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

  const importCollectible = useCallback(
    async (assetIndex: number) => {
      try {
        setImportStatus('idle')
        const connector = connectorReference.current
        if (!connector || !passphrase) return

        const result = await collectibleService.initializeImportCollectible({
          address: selectedAccount,
          assetIndex,
        })

        const unsignedTransaction = await algorand.decodeUnsignedTransaction(
          result.txn
        )

        const signedTransaction = await connector.signTransaction(
          unsignedTransaction
        )

        const encodedSignedTransaction =
          algorand.encodeSignedTransaction(signedTransaction)

        await collectibleService.importCollectible({
          address: selectedAccount,
          assetIndex,
          passphrase,
          signedTransaction: encodedSignedTransaction,
          transactionId: result.txnId,
        })

        await algorand.waitForConfirmation(result.txnId)
        await disconnect()
        setImportStatus('success')
      } catch (error) {
        setImportStatus('error')
        throw error
      }
    },
    [disconnect, passphrase, selectedAccount]
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
      importCollectible,
      importStatus,
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
      importCollectible,
      importStatus,
      hasOptedIn,
      selectedAccount,
    ]
  )
}
