import { CheckoutStatus, PublishedPack, ToPaymentBase } from '@algomart/schemas'
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
import { FormValidation } from '@/contexts/payment-context'
import { formatCurrency } from '@/utils/format-currency'
import { urls } from '@/utils/urls'

export interface CryptoFormProps {
  address: string | null
  bid: string | null
  className?: string
  formErrors?: FormValidation
  handleCheckForPurchase: () => void
  setStatus: (status: CheckoutStatus) => void
  handleSubmitBid: (event: FormEvent<HTMLFormElement>) => Promise<void>
  initialBid?: string
  isAuctionActive: boolean
  isLoading: boolean
  price: string | null
  release?: PublishedPack
  setBid: (bid: string | null) => void
  setError: (error: string) => void
  setTransfer: (transfer: ToPaymentBase | null) => void
  transfer: ToPaymentBase | null
}

export default function CryptoForm({
  address,
  bid,
  className,
  formErrors,
  handleCheckForPurchase,
  setStatus,
  handleSubmitBid,
  initialBid,
  isAuctionActive,
  isLoading,
  price,
  release,
  setBid,
  setError,
  setTransfer,
  transfer,
}: CryptoFormProps) {
  const { t, lang } = useTranslation()
  const { push } = useRouter()
  const [isConfirmed, setIsConfirmed] = useState<boolean>(false)

  if (!address) {
    return (
      <div className={css.noAddress}>
        <p>{t('forms:errors.addressNotFound')}</p>
        <Button
          onClick={() =>
            push(
              urls.checkoutPack.replace(':packSlug', release?.slug as string)
            )
          }
        >
          {t('common:actions.Go Back')}
        </Button>
      </div>
    )
  }

  return (
    <form className={className} onSubmit={handleSubmitBid}>
      {formErrors && 'bid' in formErrors && (
        <AlertMessage
          className={css.notification}
          content={formErrors.bid}
          variant="red"
        />
      )}
      <Heading className={css.heading} level={1}>
        {t('common:nav.payment.Pay with Crypto Wallet')}
      </Heading>
      {isAuctionActive ? (
        <>
          <Bid
            bid={bid}
            className={css.bid}
            initialBid={initialBid}
            setBid={setBid}
          />
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
            setStatus={setStatus}
            price={price}
            release={release}
            setError={setError}
            setTransfer={setTransfer}
            transfer={transfer}
          />
          <hr />
        </>
      )}

      {/* Price */}
      <div className={css.priceContainer}>
        <p className={css.priceLabel}>{t('release:Total')}</p>
        <p className={css.priceValue}>{formatCurrency(price, lang)}</p>
      </div>

      {!isAuctionActive ? (
        <Button
          className={css.checkForTransfer}
          disabled={!!transfer || isLoading}
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
