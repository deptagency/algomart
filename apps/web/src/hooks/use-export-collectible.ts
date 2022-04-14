import { useCallback, useMemo, useRef, useState } from 'react'

import { useConfig } from './use-config'

import {
  AlgorandAdapter,
  IConnector,
  UnsignedTransaction,
} from '@/libs/algorand-adapter'
import { WalletConnectAdapter } from '@/libs/wallet-connect-adapter'
import { CollectibleService } from '@/services/collectible-service'

export type ExportStatus =
  | 'idle'
  | 'generate-transactions'
  | 'sign-transaction'
  | 'pending'
  | 'success'
  | 'error'

export function useExportCollectible(passphrase: string) {
  const [connected, setConnected] = useState(false)
  const [accounts, setAccounts] = useState([])
  const [selectedAccount, selectAccount] = useState('')
  const [exportStatus, setExportStatus] = useState<ExportStatus>('idle')
  const connectorReference = useRef<IConnector>()
  const Environment = useConfig()

  const algorand = useMemo(
    () => new AlgorandAdapter(Environment.chainType),
    [Environment.chainType]
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

  const exportCollectible = useCallback(
    async (assetIndex: number) => {
      try {
        setExportStatus('idle')
        const connector = connectorReference.current
        if (!connector || !passphrase) return

        setExportStatus('generate-transactions')
        const result =
          await CollectibleService.instance.initializeExportCollectible({
            address: selectedAccount,
            assetIndex,
          })
        let txnId = ''

        const unsignedTransactions = await Promise.all(
          result.map(async (txn): Promise<UnsignedTransaction> => {
            return txn.signer === selectedAccount
              ? (txnId = txn.txnId) && {
                  txn: await algorand.decodeUnsignedTransaction(txn.txn),
                }
              : {
                  txn: await algorand.decodeUnsignedTransaction(txn.txn),
                  signers: [txn.signer],
                }
          })
        )

        setExportStatus('sign-transaction')
        const signedTransactions = await connector.signTransaction(
          unsignedTransactions,
          undefined,
          true
        )
        const signedTransaction = signedTransactions.find((txn) => !!txn)

        setExportStatus('pending')
        const encodedSignedTransaction =
          algorand.encodeSignedTransaction(signedTransaction)

        await CollectibleService.instance.exportCollectible({
          address: selectedAccount,
          assetIndex,
          passphrase,
          signedTransaction: encodedSignedTransaction,
          transactionId: txnId,
        })

        await algorand.waitForConfirmation(txnId)
        await disconnect()
        setExportStatus('success')
      } catch (error) {
        setExportStatus('error')
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
