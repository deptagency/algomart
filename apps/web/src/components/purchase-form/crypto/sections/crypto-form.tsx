import { ToPaymentBase } from '@algomart/schemas'
import { RefreshIcon } from '@heroicons/react/outline'
import clsx from 'clsx'
import { useRouter } from 'next/router'
import useTranslation from 'next-translate/useTranslation'
import { FormEvent, useState } from 'react'

import CryptoFormInstructions from './crypto-form-instructions'
import CryptoFormWalletConnect from './crypto-form-wc'

import css from './crypto-form.module.css'

import AlertMessage from '@/components/alert-message/alert-message'
import Button from '@/components/button'
import Checkbox from '@/components/checkbox'
import Heading from '@/components/heading'
import Bid from '@/components/purchase-form/shared/bid'
import { useI18n } from '@/contexts/i18n-context'
import { usePaymentContext } from '@/contexts/payment-context'
import { useCurrency } from '@/hooks/use-currency'
import { useLocale } from '@/hooks/use-locale'
import { formatCurrency } from '@/utils/format-currency'
import { urlFor, urls } from '@/utils/urls'

export interface CryptoFormProps {
  className?: string
  isLoading?: boolean
  handleCheckForPurchase: () => Promise<void>
  handlePurchase: (transfer: ToPaymentBase) => Promise<void>
  handleSubmitBid: (event: FormEvent<HTMLFormElement>) => Promise<void>
  setError: (error: string) => void
}

export default function CryptoForm({
  className,
  handlePurchase,
  handleCheckForPurchase,
  handleSubmitBid,
  isLoading,
  setError,
}: CryptoFormProps) {
  const locale = useLocale()
  const { t } = useTranslation()
  const {
    address,
    getError,
    isAuctionActive,
    price,
    release,
    setLoadingText,
    setStatus,
  } = usePaymentContext()
  const currency = useCurrency()
  const { conversionRate } = useI18n()
  const { push } = useRouter()
  const [isConfirmed, setIsConfirmed] = useState<boolean>(false)

  if (!address) {
    return (
      <div className={css.noAddress}>
        <p>{t('forms:errors.addressNotFound')}</p>
        <Button
          onClick={() =>
            push(urlFor(urls.checkoutPack, { packSlug: release?.slug }))
          }
        >
          {t('common:actions.Go Back')}
        </Button>
      </div>
    )
  }

  return (
    <form className={className} onSubmit={handleSubmitBid}>
      {getError('bid') ? (
        <AlertMessage
          className={css.notification}
          content={getError('bid')}
          variant="red"
        />
      ) : null}

      <Heading className={css.heading} level={1}>
        {t('common:nav.payment.Pay with Crypto Wallet')}
      </Heading>

      {isAuctionActive() ? (
        <>
          <Bid className={css.bid} />
          <Checkbox
            checked={isConfirmed}
            name="confirmBid"
            label={t('forms:fields.bid.confirmation')}
            onChange={() => setIsConfirmed(!isConfirmed)}
          />
        </>
      ) : (
        <>
          <CryptoFormInstructions price={price} />
          <CryptoFormWalletConnect
            address={address}
            handlePurchase={handlePurchase}
            price={price}
            release={release}
            setError={setError}
            setLoadingText={setLoadingText}
            setStatus={setStatus}
          />
          <hr />
        </>
      )}

      {/* Price */}
      <div className={css.priceContainer}>
        <p className={css.priceLabel}>{t('release:Total')}</p>
        <p className={css.priceValue}>
          {formatCurrency(
            price,
            locale,
            currency,
            isAuctionActive() ? 1 : conversionRate
          )}
        </p>
      </div>

      {!isAuctionActive() ? (
        <Button
          className={css.checkForTransfer}
          disabled={isLoading}
          fullWidth
          onClick={handleCheckForPurchase}
          type="button"
        >
          <RefreshIcon
            className={clsx(css.icon, {
              [css.spinningIcon]: isLoading,
            })}
          />
          {t('common:actions.Check for Payment')}
        </Button>
      ) : (
        <Button
          className={css.submit}
          fullWidth
          type="submit"
          variant="primary"
        >
          {t('common:actions.Place Bid')}
        </Button>
      )}
    </form>
  )
}
