import { encodeTransaction } from '@algomart/shared/algorand'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

import { useConfig } from './use-config'

import { AlgorandAdapter, IConnector } from '@/libs/algorand-adapter'
import { WalletConnectAdapter } from '@/libs/wallet-connect-adapter'
import { formatToDecimal } from '@/utils/currency'

export type PurchaseStatus =
  | 'idle'
  | 'validation'
  | 'sign-transaction'
  | 'pending'
  | 'success'
  | 'error'

export function usePurchaseCollectible(passphrase: string) {
  const [connected, setConnected] = useState(false)
  const [accounts, setAccounts] = useState([])
  const [selectedAccount, selectAccount] = useState('')
  const [selectedAccountBalance, selectAccountBalance] = useState<
    number | null
  >(null)
  const [purchaseStatus, setPurchaseStatus] = useState<PurchaseStatus>('idle')
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
      setConnected(false)
      selectAccount('')
    }
  }, [])

  const retrieveAssetData = useCallback(async () => {
    try {
      if (connectorReference.current && selectedAccount) {
        const assetData = await algorand.getAssetData(selectedAccount)
        const algoAsset = assetData.find((asset) => asset.unitName === 'ALGO')
        console.log('algoAsset', algoAsset)
        if (!algoAsset?.amount) return
        const balance = formatToDecimal(algoAsset.amount, algoAsset.decimals)
        selectAccountBalance(balance || null)
        return algoAsset
      }
      throw new Error('No account connected')
    } catch (error) {
      console.error(error)
      selectAccountBalance(null)
      return false
    }
  }, [algorand, selectedAccount])

  const purchaseCollectible = useCallback(
    async (address: string | null) => {
      try {
        if (!address) return

        const price = 0
        setPurchaseStatus('idle')
        const connector = connectorReference.current
        if (!connector || !passphrase) return

        setPurchaseStatus('validation')
        const algoAsset = await retrieveAssetData()
        console.log('algoAsset:', algoAsset)

        // Check that the balance is higher than the price
        if (!algoAsset || algoAsset.amount < price) {
          setPurchaseStatus('error')
          return
        }

        const assetTx = await algorand.makeAssetTransferTransaction({
          amount: price * 10_000, // convert to microALGOs
          from: selectedAccount,
          to: address,
          assetIndex: algoAsset.id,
          note: undefined,
          rekeyTo: undefined,
        })

        // User signs transaction and we submit to Algorand network
        setPurchaseStatus('sign-transaction')
        const signedTransaction = await connector
          .signTransaction([await encodeTransaction(assetTx)])
          .catch(() => null)

        setPurchaseStatus('pending')
        await algorand.waitForConfirmation(signedTransaction)
        await disconnect()
        setPurchaseStatus('success')
      } catch (error) {
        console.error(error)
        setPurchaseStatus('error')
        throw error
      }
    },
    [algorand, disconnect, passphrase, retrieveAssetData, selectedAccount]
  )

  const hasOptedIn = useCallback(
    async (assetIndex: number) => {
      return await algorand.hasOptedIn(selectedAccount, assetIndex)
    },
    [algorand, selectedAccount]
  )

  useEffect(() => {
    // Retrieve the wallet balance when an account is selected
    if (selectedAccount) {
      retrieveAssetData()
    }
  }, [retrieveAssetData, selectedAccount])

  return useMemo(
    () => ({
      accounts,
      connect,
      connected,
      disconnect,
      purchaseCollectible,
      purchaseStatus,
      hasOptedIn,
      selectAccount,
      selectedAccount,
      setAccounts,
      selectedAccountBalance,
    }),
    [
      accounts,
      connect,
      connected,
      disconnect,
      purchaseCollectible,
      purchaseStatus,
      hasOptedIn,
      selectedAccount,
      selectedAccountBalance,
    ]
  )
}
