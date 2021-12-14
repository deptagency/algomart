import { PackType } from '@algomart/schemas'
import useTranslation from 'next-translate/useTranslation'
import { FormEvent, useCallback, useRef, useState } from 'react'

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
  const isAuctionActive =
    release?.type === PackType.Auction &&
    isAfterNow(new Date(release.auctionUntil as string))
  const [connected, setConnected] = useState(false)
  const [account, setAccount] = useState<string>('')
  const connectorReference = useRef<IConnector>()
  const [error, setError] = useState<string>('')

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

  const purchase = useCallback(async () => {
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
      setError(t('forms:errors.minUSDC', { balance: usdcBalance, min: price }))
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
        // Creating payment for the pending transfer
        const transfer = await checkoutService.createTransferPayment({
          packTemplateId: release.templateId,
          destinationAddress: address,
        })
        if (!transfer) {
          // While this shouldn't happen, there's a possibility the payment may still have worked
          // @TODO: Find way to handle this better - possibly send to customer support email or direct to contact
          setError(t('forms:errors.paymentNotCreated'))
          setStatus('error')
          return
        }
        // Success!
        setStatus('success')
      }
    }
  }, [account, address, price, release?.templateId, setStatus, t])

  const handleSubmitPurchase = useCallback(
    async (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault()
      const data = new FormData(event.currentTarget)
      await (release?.type === PackType.Auction && isAuctionActive
        ? onSubmitBid(data, 'crypto')
        : purchase())
    },
    [release?.type, isAuctionActive, onSubmitBid, purchase]
  )

  const handleRetry = useCallback(() => {
    setStatus('form')
  }, [setStatus])

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
          handleSubmitPurchase={handleSubmitPurchase}
          isAuctionActive={isAuctionActive}
          price={price}
          setBid={setBid}
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
