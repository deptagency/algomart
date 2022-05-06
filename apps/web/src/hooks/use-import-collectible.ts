import { WalletTransaction } from '@algomart/shared/algorand'
import { useCallback, useMemo, useRef, useState } from 'react'

import { useConfig } from './use-config'

import { AlgorandAdapter, IConnector } from '@/libs/algorand-adapter'
import { WalletConnectAdapter } from '@/libs/wallet-connect-adapter'
import { CollectibleService } from '@/services/collectible-service'

export type ImportStatus =
  | 'idle'
  | 'generate-transactions'
  | 'sign-transaction'
  | 'pending'
  | 'success'
  | 'error'

export function useImportCollectible(passphrase: string) {
  const [connected, setConnected] = useState(false)
  const [accounts, setAccounts] = useState([])
  const [selectedAccount, selectAccount] = useState('')
  const [importStatus, setImportStatus] = useState<ImportStatus>('idle')
  const connectorReference = useRef<IConnector>()
  const config = useConfig()
  const algorand = useMemo(
    () => new AlgorandAdapter(config.chainType),
    [config.chainType]
  )

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
  }, [algorand])

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

        setImportStatus('generate-transactions')
        const result =
          await CollectibleService.instance.initializeImportCollectible({
            address: selectedAccount,
            assetIndex,
          })
        let txID = ''

        const unsignedTransactions = await Promise.all(
          result.map(async (txn): Promise<WalletTransaction> => {
            if (txn.signers?.includes(selectedAccount)) {
              txID = txn.txID
              return txn
            }

            return {
              ...txn,
              signers: [],
            }
          })
        )

        setImportStatus('sign-transaction')
        const signedTransactions = await connector.signTransaction(
          unsignedTransactions,
          true
        )
        const signedTransaction = signedTransactions.find((txn) => !!txn)

        setImportStatus('pending')
        const encodedSignedTransaction =
          algorand.encodeSignedTransaction(signedTransaction)

        await CollectibleService.instance.importCollectible({
          address: selectedAccount,
          assetIndex,
          passphrase,
          signedTransaction: encodedSignedTransaction,
          transactionId: txID,
        })

        await algorand.waitForConfirmation(txID)
        await disconnect()
        setImportStatus('success')
      } catch (error) {
        setImportStatus('error')
        throw error
      }
    },
    [algorand, disconnect, passphrase, selectedAccount]
  )

  const hasOptedIn = useCallback(
    async (assetIndex: number) => {
      return await algorand.hasOptedIn(selectedAccount, assetIndex)
    },
    [algorand, selectedAccount]
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
