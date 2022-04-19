import { ToPaymentBase } from '@algomart/schemas'
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
import Currency from '@/components/currency'
import Heading from '@/components/heading'
import Bid from '@/components/purchase-form/shared/bid'
import { usePaymentContext } from '@/contexts/payment-context'
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
  const { t } = useTranslation()
  const { address, getError, isAuctionActive, price, release } =
    usePaymentContext()
  const { push } = useRouter()
  const [isConfirmed, setIsConfirmed] = useState(false)

  if (!address) {
    return (
      <div className={css.noAddress}>
        <p>{t('forms:errors.addressNotFound')}</p>
        <Button
          size="small"
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
    <form className={clsx(css.form, className)} onSubmit={handleSubmitBid}>
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
            handlePurchase={handlePurchase}
            setError={setError}
          />
          <hr />
        </>
      )}

      {/* Price */}
      <div className={css.priceContainer}>
        <p className={css.priceLabel}>{t('release:Total')}</p>
        <p className={css.priceValue}>
          <Currency value={price} />
        </p>
      </div>

      {!isAuctionActive() ? (
        <Button
          className={css.checkForTransfer}
          disabled={isLoading}
          fullWidth
          onClick={handleCheckForPurchase}
          busy={isLoading}
        >
          {t('common:actions.Check for Payment')}
        </Button>
      ) : (
        <Button
          className={css.submit}
          fullWidth
          disabled={!isConfirmed}
          type="submit"
        >
          {t('common:actions.Place Bid')}
        </Button>
      )}
    </form>
  )
}
