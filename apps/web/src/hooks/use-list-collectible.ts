import { WalletTransaction } from '@algomart/shared/algorand'
import { useCallback, useMemo, useRef, useState } from 'react'

import { useConfig } from './use-config'

import { AlgorandAdapter, IConnector } from '@/libs/algorand-adapter'
import { WalletConnectAdapter } from '@/libs/wallet-connect-adapter'
import { CollectibleService } from '@/services/collectible-service'

export type ListStatus =
  | 'idle'
  | 'generate-transactions'
  | 'sign-transaction'
  | 'pending'
  | 'success'
  | 'error'

export function useListCollectible(passphrase: string) {
  const [connected, setConnected] = useState(false)
  const [accounts, setAccounts] = useState([])
  const [selectedAccount, selectAccount] = useState('')
  const [listStatus, setListStatus] = useState<ListStatus>('idle')
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

  const listCollectible = useCallback(
    async (assetIndex: number) => {
      try {
        setListStatus('idle')
        const connector = connectorReference.current
        if (!connector || !passphrase) return

        setListStatus('generate-transactions')
        const result =
          await CollectibleService.instance.initializeExportCollectible({
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

        setListStatus('sign-transaction')
        const signedTransactions = await connector.signTransaction(
          unsignedTransactions,
          true
        )
        const signedTransaction = signedTransactions.find((txn) => !!txn)

        setListStatus('pending')
        const encodedSignedTransaction =
          algorand.encodeSignedTransaction(signedTransaction)

        await CollectibleService.instance.listCollectible({
          assetIndex,
          passphrase,
          signedTransaction: encodedSignedTransaction,
          transactionId: txID,
        })

        await algorand.waitForConfirmation(txID)
        setListStatus('success')
      } catch (error) {
        console.error(error)
        setListStatus('error')
        throw error
      }
    },
    [algorand, passphrase, selectedAccount]
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
      sellCollectible: listCollectible,
      exportStatus: listStatus,
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
      listCollectible,
      listStatus,
      hasOptedIn,
      selectedAccount,
    ]
  )
}
