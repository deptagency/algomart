import { CheckoutStatus, PaymentStatus, ToPaymentBase } from '@algomart/schemas'
import useTranslation from 'next-translate/useTranslation'
import { useCallback, useRef, useState } from 'react'

import css from './crypto-form.module.css'

import Button from '@/components/button'
import Heading from '@/components/heading'
import { useI18n } from '@/contexts/i18n-context'
import { usePaymentContext } from '@/contexts/payment-context'
import { useCurrency } from '@/hooks/use-currency'
import { AlgorandAdapter, ChainType, IConnector } from '@/libs/algorand-adapter'
import { WalletConnectAdapter } from '@/libs/wallet-connect-adapter'
import { CheckoutService } from '@/services/checkout-service'
import { formatIntToFixed } from '@/utils/format-currency'
import { poll } from '@/utils/poll'

const algorand = new AlgorandAdapter(ChainType.TestNet)

const formatAccount = (account: string) =>
  `${account.slice(0, 6)}...${account.slice(-6)}`

export interface CryptoFormWalletConnectProps {
  handlePurchase: (transfer: ToPaymentBase) => Promise<void>
  setError: (error: string) => void
}

export default function CryptoFormWalletConnect({
  handlePurchase,
  setError,
}: CryptoFormWalletConnectProps) {
  const { address, price, release, setLoadingText, setStatus } =
    usePaymentContext()

  const { t } = useTranslation()
  const currency = useCurrency()
  const { conversionRate } = useI18n()
  const [connected, setConnected] = useState(false)
  const [account, setAccount] = useState<string>('')
  const connectorReference = useRef<IConnector>()

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

  const handleWalletConnectPurchase = useCallback(async () => {
    setStatus(CheckoutStatus.loading)
    setLoadingText(t('common:statuses.Validating Payment Information'))
    // If using WalletConnect:
    if (!account || !connected || !address || !price || !release?.templateId) {
      setError(t('forms:errors.invalidDetails'))
      setStatus(CheckoutStatus.error)
      return
    }
    const assetData = await algorand.getAssetData(account)
    const usdcAsset = assetData.find((asset) => asset.unitName === 'USDC')
    if (!usdcAsset) {
      // No USDC asset found
      setError(t('forms:errors.noUSDC'))
      setStatus(CheckoutStatus.error)
      return
    }

    const usdcBalanceInCents = usdcAsset.amount

    if (usdcBalanceInCents < price) {
      // Not enough USDC balance to cover payment
      setError(
        t('forms:errors.minUSDC', {
          balance: formatIntToFixed(usdcBalanceInCents, 'USD'),
          currency: 'USDC',
          min: formatIntToFixed(price, 'USD'),
        })
      )
      setStatus(CheckoutStatus.error)
      return
    }

    // Submit the transaction to Algorand
    const connector = connectorReference.current
    if (connector) {
      setLoadingText(t('common:statuses.Connected to Wallet'))
      const assetTx = await algorand.makeAssetTransferTransaction({
        amount: price,
        from: account,
        to: address,
        assetIndex: usdcAsset.id,
        note: undefined,
        rekeyTo: undefined,
      })
      // User signs transaction and we submit to Algorand network
      const txn = await connector
        .signTransaction([
          {
            txn: assetTx,
          },
        ])
        .catch(() => null)
      setLoadingText(t('common:statuses.Sent Transaction'))
      if (txn) {
        setLoadingText(t('common:statuses.Transaction Received'))
        // Check for pending transfer
        setLoadingText(t('common:statuses.Searching for Payment'))
        const completeWhenNotPendingForTransfer = (
          transfer: ToPaymentBase | null
        ) => !(transfer?.status === PaymentStatus.Paid)
        const transfer = await poll<ToPaymentBase | null>(
          async () =>
            await CheckoutService.instance
              .getTransferByAddress(address)
              .catch(() => null),
          completeWhenNotPendingForTransfer,
          1000
        )
        if (!transfer || transfer.status === PaymentStatus.Failed) {
          setError(t('forms:errors.transferNotFound'))
          setStatus(CheckoutStatus.error)
          return
        }
        return handlePurchase(transfer)
      } else {
        setError(t('forms:errors.transferDeclined'))
        setStatus(CheckoutStatus.error)
      }
    }
  }, [
    account,
    address,
    connected,
    conversionRate,
    currency,
    handlePurchase,
    price,
    release?.templateId,
    setError,
    setLoadingText,
    setStatus,
    t,
  ])

  const copyToClipboard = useCallback(() => {
    if (navigator) {
      navigator.clipboard.writeText(address as string)
    }
  }, [address])

  return (
    <section className={css.walletConnect}>
      {connected ? (
        <div className={css.connect}>
          <Button fullWidth onClick={handleWalletConnectPurchase}>
            {t('common:actions.Purchase with Algorand Wallet')}
          </Button>
          <div className={css.connectedAccount}>
            <Heading level={3}>
              {t('forms:fields.payWithCrypto.Connected account')}:
            </Heading>
            <p>{formatAccount(account)}</p>
          </div>
          <Button
            className={css.disconnectButton}
            onClick={disconnect}
            size="small"
            variant="tertiary"
          >
            {t('common:actions.Disconnect')}
          </Button>
        </div>
      ) : (
        <>
          <Button fullWidth onClick={connect}>
            {t('common:actions.Connect to Algorand Wallet')}
          </Button>
          <div className={css.copyWrapper}>
            <span>{t('common:global.or')}</span>
            <Button
              className={css.copyButton}
              onClick={copyToClipboard}
              variant="tertiary"
            >
              {t('common:actions.Copy to clipboard')}
            </Button>
          </div>
        </>
      )}
    </section>
  )
}
