import { Payment } from '@algomart/schemas'
import {
  encodeTransaction,
  UsdcAssetIdByChainType,
} from '@algomart/shared/algorand'
import useTranslation from 'next-translate/useTranslation'
import { useCallback, useEffect, useState } from 'react'

import css from './usdc-payment-form.module.css'

import AlertMessage from '@/components/alert-message/alert-message'
import Button from '@/components/button'
import { H3 } from '@/components/heading'
import { AppConfig } from '@/config'
import { useWalletConnectContext } from '@/contexts/wallet-connect-context'
import { AlgorandAdapter } from '@/libs/algorand-adapter'
import {
  formatCurrency,
  formatIntToFixed,
  formatToDecimal,
} from '@/utils/currency'
import { formatAlgoAddress } from '@/utils/format-string'

const algorand = new AlgorandAdapter(AppConfig.chainType)

export interface UsdcPaymentFormProps {
  amount: number
  destinationAddress: string
  handlePurchaseSuccess: (payment: Payment) => void
  handleSubmitPayment: (encodedSignedTransaction: string) => Promise<void>
  loadingText: string
  setLoadingText: (loadingText: string) => void
}

export default function UsdcPaymentForm({
  amount,
  destinationAddress,
  handlePurchaseSuccess,
  handleSubmitPayment,
  loadingText,
  setLoadingText,
}: UsdcPaymentFormProps) {
  const { t } = useTranslation()
  const [error, setError] = useState('')
  const handleError = useCallback(
    (error: string) => {
      setLoadingText('')
      setError(error)
    },
    [setLoadingText]
  )

  const { account, connected, connector, handleConnect, handleDisconnect } =
    useWalletConnectContext()

  const onConnect = useCallback(async () => {
    await handleConnect()
    setLoadingText('')
    setError('')
  }, [handleConnect, setLoadingText])

  const onDisconnect = useCallback(async () => {
    await handleDisconnect()
    setLoadingText('')
    setError('')
  }, [handleDisconnect, setLoadingText])

  const createUsdcPayment = useCallback(
    async (encodedSignedTransaction: string) => {
      // Creating payment for the pending transfer
      try {
        await handleSubmitPayment(encodedSignedTransaction)
      } catch {
        handleError(t('forms:errors.paymentNotCreated'))
      }
    },
    [t, handleError, handleSubmitPayment]
  )

  const handleWalletConnectPurchase = useCallback(async () => {
    setLoadingText(t('common:statuses.Validating Payment Information'))
    if (!account || !connected || !destinationAddress || !amount) {
      handleError(t('forms:errors.invalidDetails'))
      return
    }
    const assetData = await algorand.getAssetData(account, true)
    const usdcAsset = assetData.find(
      (asset) => asset.assetIndex === UsdcAssetIdByChainType[algorand.chainType]
    )
    if (!usdcAsset) {
      // No USDC asset found
      handleError(t('forms:errors.noUSDC'))
      return
    }

    const usdcBalance = formatToDecimal(
      usdcAsset.amount,
      usdcAsset.decimals ?? 6
    )
    const usdcBalanceInCents = usdcBalance * 100

    if (usdcBalanceInCents < amount) {
      // Not enough USDC balance in wallet to cover payment
      handleError(
        t('forms:errors.minUSDC', {
          balance: formatIntToFixed(usdcBalanceInCents, 'USD'),
          currency: 'USDC',
          min: formatIntToFixed(amount, 'USD'),
        })
      )
      return
    }

    // Request transaction signature, then submit the payment
    if (connector.current) {
      setLoadingText(t('common:statuses.Connected to Wallet'))
      const assetTx = await algorand.makeAssetTransferTransaction({
        amount: amount * 10_000, // convert to microUSDCa $(priceInCents / 100) * 1,000,000)
        from: account,
        to: destinationAddress,
        assetIndex: usdcAsset.assetIndex,
        note: undefined,
        rekeyTo: undefined,
      })
      // User signs transaction
      // note: we do not submit to Algorand on the client
      const signedTransactions = await connector.current
        .signTransaction([await encodeTransaction(assetTx)], true)
        .catch(() => null)
      setLoadingText(t('common:statuses.Sent Transaction'))
      if (signedTransactions) {
        const signedTransaction = signedTransactions.find((trx) => !!trx)
        const encodedSignedTransaction =
          algorand.encodeSignedTransaction(signedTransaction)
        // submit payment to API
        await createUsdcPayment(encodedSignedTransaction)
      } else {
        handleError(t('forms:errors.transferDeclined'))
      }
    }
  }, [
    setLoadingText,
    t,
    account,
    connected,
    destinationAddress,
    amount,
    connector,
    handleError,
    createUsdcPayment,
  ])

  const isAwaitingConfirmationInApp =
    connected && loadingText === t('common:statuses.Connected to Wallet')

  useEffect(() => {
    if (account) {
      // Check for USDC in wallet as soon as connected so we can provide early
      // feedback to the user.
      algorand.hasOptedInToUSDC(account).then((hasOptedIn) => {
        if (!hasOptedIn) {
          setError(t('forms:errors.noUSDC'))
        }
      })
    }
  }, [account, t])

  return (
    <div className={css.container}>
      <H3>{t('forms:purchaseCredits.Send exactly')}</H3>
      <div className={css.sendAmount}>
        <div className={css.amount}>{formatCurrency(amount)}</div>
        <p>{t('forms:purchaseCredits.usdcaAlgorandOnly')}</p>
      </div>

      {connected ? (
        <div className={css.connectedAccountContainer}>
          <H3>{t('forms:fields.payWithCrypto.Connected account')}</H3>
          <div className={css.connectedAccount}>
            <p>{formatAlgoAddress(account)}</p>
            <Button
              className={css.disconnectButton}
              onClick={onDisconnect}
              variant="ghost"
            >
              {t('common:actions.Disconnect')}
            </Button>
          </div>
        </div>
      ) : null}

      {loadingText ? (
        <AlertMessage
          variant={isAwaitingConfirmationInApp ? 'green' : 'blue'}
          className="mb-4"
          content={
            isAwaitingConfirmationInApp ? (
              <div>
                <strong>{loadingText}</strong>
                <div>
                  {t('common:statuses.Please approve this transaction')}
                </div>
              </div>
            ) : (
              loadingText
            )
          }
        />
      ) : null}

      {error && !loadingText ? (
        <AlertMessage
          variant="red"
          content={
            !destinationAddress ? t('forms:errors.addressNotFound') : error
          }
        />
      ) : null}

      <div className="text-center">
        {connected ? (
          <Button
            busy={!!loadingText}
            className="mt-8"
            fullWidth
            onClick={handleWalletConnectPurchase}
            size="large"
          >
            {t('common:actions.Purchase with Algorand Wallet')}
          </Button>
        ) : (
          <Button
            busy={!destinationAddress}
            className="mt-8"
            fullWidth
            onClick={onConnect}
            size="large"
          >
            {t('common:actions.Connect to Algorand Wallet')}
          </Button>
        )}
      </div>
    </div>
  )
}
