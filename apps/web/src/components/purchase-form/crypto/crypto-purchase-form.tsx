import { PackType, PaymentStatus, ToPaymentBase } from '@algomart/schemas'
import { useRouter } from 'next/router'
import useTranslation from 'next-translate/useTranslation'
import { FormEvent, useCallback, useEffect, useRef, useState } from 'react'

import CryptoPurchaseError from './sections/crypto-error'
import CryptoForm from './sections/crypto-form'
import CryptoHeader from './sections/crypto-header'
import CryptoSuccess from './sections/crypto-success'

import css from './crypto-purchase-form.module.css'

import Loading from '@/components/loading/loading'
import { PaymentContextProps } from '@/contexts/payment-context'
import { AlgorandAdapter, ChainType, IConnector } from '@/libs/algorand-adapter'
import { WalletConnectAdapter } from '@/libs/wallet-connect-adapter'
import checkoutService from '@/services/checkout-service'
import { isAfterNow } from '@/utils/date-time'
import { formatToDecimal, isGreaterThanOrEqual } from '@/utils/format-currency'
import { formatFloatToInt } from '@/utils/format-currency'
import { poll } from '@/utils/poll'

const algorand = new AlgorandAdapter(ChainType.TestNet)

export interface CryptoPurchaseFormProps {
  address?: string
  addressTag?: string
}

export default function CryptoPurchaseForm({
  address,
  bid,
  currentBid,
  handleSubmitBid: onSubmitBid,
  loadingText,
  price,
  release,
  setBid,
  setStatus,
  status,
}: PaymentContextProps & CryptoPurchaseFormProps) {
  const { t } = useTranslation()
  const router = useRouter()
  const isAuctionActive =
    release?.type === PackType.Auction &&
    isAfterNow(new Date(release.auctionUntil as string))
  const [connected, setConnected] = useState(false)
  const [account, setAccount] = useState<string>('')
  const connectorReference = useRef<IConnector>()
  const [error, setError] = useState<string>('')
  const [transfer, setTransfer] = useState<ToPaymentBase | null>(null)

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

  const disconnect = useCallback(async () => {
    const connector = connectorReference.current
    if (connector) {
      await connector.disconnect()
      setConnected(false)
      setAccount('')
    }
  }, [])

  const handleInitatingPurchase = useCallback(async () => {
    // If using WalletConnect:
    if (account && connected) {
      if (!address || !price || !release?.templateId) {
        setError(t('forms:errors.invalidDetails'))
        setStatus('error')
        return
      }
      const assetData = await algorand.getAssetData(account)
      const usdcAsset = assetData.find((asset) => asset.unitName === 'USDC')
      if (!usdcAsset) {
        // No USDC asset found
        setError(t('forms:errors.noUSDC'))
        setStatus('error')
        return
      }

      // Check USDC balance
      const usdcBalance = formatToDecimal(usdcAsset.amount, usdcAsset.decimals)
      const usdcBalanceInt = formatFloatToInt(usdcBalance)
      const priceInt = formatFloatToInt(price)
      if (!isGreaterThanOrEqual(usdcBalanceInt, priceInt)) {
        // Not enough USDC
        setError(
          t('forms:errors.minUSDC', { balance: usdcBalance, min: price })
        )
        setStatus('error')
        return
      }

      // Submit the transaction to Algorand
      const connector = connectorReference.current
      if (connector) {
        const assetTx = await algorand.makeAssetTransferTransaction({
          // price of pack + non-participation transaction fee
          amount: priceInt * 10_000 + 1000,
          from: account,
          to: address,
          assetIndex: usdcAsset.id,
          note: undefined,
          rekeyTo: undefined,
        })
        // User signs transaction and we submit to Algorand network
        const txn = await connector.signTransaction(assetTx)
        if (txn) {
          // Check for pending transfer
          const completeWhenNotPendingForTransfer = (
            transfer: ToPaymentBase | null
          ) => !(transfer?.status !== PaymentStatus.Pending)
          const transferResp = await poll<ToPaymentBase | null>(
            async () => await checkoutService.getTransferByAddress(address),
            completeWhenNotPendingForTransfer,
            1000
          )
          console.log('purchase transferResp:', transferResp)
          if (!transferResp || transferResp.status === PaymentStatus.Failed) {
            setError(t('forms:errors.transferNotFound'))
            setStatus('form')
            return
          }
          setTransfer(transfer)
        }
      }
    }
  }, [
    account,
    address,
    connected,
    price,
    release?.templateId,
    setStatus,
    t,
    transfer,
  ])

  const handleCheckForPurchase = useCallback(async () => {
    if (!address) return router.reload()
    // Check if purchase has been made for this address
    const transfer = await checkoutService.getTransferByAddress(address)
    console.log('handleCheckForPurchase transfer:', transfer)
    // Initiate payment creation and transfer if so
    if (transfer) {
      setTransfer(transfer)
    }
  }, [address, router])

  const handleSubmittingPurchase = useCallback(async () => {
    if (!address || !release?.templateId || !transfer) {
      setError(t('forms:errors.invalidDetails'))
      setStatus('error')
      return
    }
    // Creating payment for the pending transfer
    const transferPayment = await checkoutService.createTransferPayment({
      packTemplateId: release.templateId,
      transferId: transfer.externalId,
      destinationAddress: address,
    })
    if (!transferPayment) {
      // While this shouldn't happen, there's a possibility the payment may still have worked
      // @TODO: Find way to handle this better - possibly send to customer support email or direct to contact
      setError(t('forms:errors.paymentNotCreated'))
      setStatus('error')
      return
    }
    // Success!
    setStatus('success')
    return transferPayment
  }, [address, release?.templateId, setStatus, t, transfer])

  const handleSubmitPurchase = useCallback(
    async (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault()
      const data = new FormData(event.currentTarget)
      await (release?.type === PackType.Auction && isAuctionActive
        ? onSubmitBid(data, 'crypto')
        : handleInitatingPurchase())
    },
    [handleInitatingPurchase, release?.type, isAuctionActive, onSubmitBid]
  )

  const handleRetry = useCallback(() => {
    setStatus('form')
  }, [setStatus])

  useEffect(() => {
    if (transfer) {
      handleSubmittingPurchase()
    }
  }, [handleSubmittingPurchase, transfer])

  return (
    <section className={css.root}>
      <CryptoHeader release={release} />

      {status === 'form' && (
        <CryptoForm
          account={account}
          bid={bid}
          className={status === 'form' ? 'w-full' : 'hidden'}
          connect={connect}
          connected={connected}
          currentBid={currentBid || null}
          disconnect={disconnect}
          handleCheckForPurchase={handleCheckForPurchase}
          handleSubmitPurchase={handleSubmitPurchase}
          isAuctionActive={isAuctionActive}
          price={price}
          setBid={setBid}
          transfer={transfer}
        />
      )}

      {status === 'loading' && (
        <Loading loadingText={loadingText} variant="primary" />
      )}

      {status === 'success' && <CryptoSuccess release={release} />}

      {status === 'error' && (
        <CryptoPurchaseError error={error} handleRetry={handleRetry} />
      )}
    </section>
  )
}
