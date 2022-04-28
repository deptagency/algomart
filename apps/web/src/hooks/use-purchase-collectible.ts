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
  | 'purchased'
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
    }
    setConnected(false)
    selectAccount('')
  }, [])

  const retrieveAccountData = useCallback(
    async (address: string) => {
      try {
        if (connectorReference.current && address) {
          const assetData = await algorand.getAssetData(address)
          const algoAsset = assetData.find((asset) => asset.unitName === 'ALGO')
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
    },
    [algorand]
  )

  const purchaseCollectible = useCallback(
    async (sellerAccountAddress: string | null, txnMessage: string) => {
      try {
        // @TODO: Update price to the amount decided by the seller
        const price = 10

        setPurchaseStatus('idle')
        const connector = connectorReference.current
        if (
          !connector ||
          !passphrase ||
          !selectedAccount ||
          !sellerAccountAddress
        )
          return

        setPurchaseStatus('validation')
        const purchaserAccount = await retrieveAccountData(selectedAccount)

        // Check that the balance is higher than the price
        if (!purchaserAccount || purchaserAccount.amount < price) {
          setPurchaseStatus('error')
          return
        }

        const assetTx = await algorand.makePaymentTransaction({
          amount: price * 10_000, // convert to microALGOs
          from: selectedAccount,
          to: sellerAccountAddress,
          note: undefined,
          rekeyTo: undefined,
        })

        // User signs transaction and we submit to Algorand network
        setPurchaseStatus('sign-transaction')
        const signedTransaction = await connector
          .signTransaction([
            await encodeTransaction(assetTx, undefined, txnMessage),
          ])
          .catch(() => null)

        if (!signedTransaction) throw new Error('Transaction not signed')

        setPurchaseStatus('pending')
        const txID = assetTx.txID()
        await algorand.waitForConfirmation(txID)
        setPurchaseStatus('purchased')

        // @TODO: Transfer collectible
        setPurchaseStatus('success')
        return
      } catch (error) {
        console.error(error)
        setPurchaseStatus('error')
        throw new Error(error)
      }
    },
    [algorand, passphrase, retrieveAccountData, selectedAccount]
  )

  useEffect(() => {
    // Retrieve the wallet balance when an account is selected
    if (selectedAccount) {
      retrieveAccountData(selectedAccount)
    }
  }, [retrieveAccountData, selectedAccount])

  return useMemo(
    () => ({
      accounts,
      connect,
      connected,
      disconnect,
      purchaseCollectible,
      purchaseStatus,
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
      selectedAccount,
      selectedAccountBalance,
    ]
  )
}
