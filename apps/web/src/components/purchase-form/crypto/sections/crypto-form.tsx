import { PublishedPack } from '@algomart/schemas'
import useTranslation from 'next-translate/useTranslation'
import { FormEvent, useState } from 'react'

import css from './crypto-form.module.css'

import AlertMessage from '@/components/alert-message/alert-message'
import AppLink from '@/components/app-link/app-link'
import Button from '@/components/button'
import Checkbox from '@/components/checkbox'
import Heading from '@/components/heading'
import Bid from '@/components/purchase-form/shared/bid'
import { FormValidation } from '@/contexts/payment-context'
import { formatCurrency } from '@/utils/format-currency'

const formatAccount = (account: string) =>
  `${account.slice(0, 6)}...${account.slice(-6)}`

export interface CryptoFormProps {
  account: string
  bid: string | null
  className?: string
  connect: () => Promise<void>
  connected: boolean
  currentBid: number | null
  disconnect: () => Promise<void>
  formErrors?: FormValidation
  handleSubmitPurchase: (event: FormEvent<HTMLFormElement>) => Promise<void>
  initialBid?: string
  isAuctionActive: boolean
  price: string | null
  setBid: (bid: string | null) => void
}

export default function CryptoForm({
  account,
  bid,
  className,
  connect,
  connected,
  currentBid,
  disconnect,
  formErrors,
  handleSubmitPurchase,
  initialBid,
  isAuctionActive,
  price,
  setBid,
}: CryptoFormProps) {
  const { t, lang } = useTranslation()
  const [isConfirmed, setIsConfirmed] = useState<boolean>(false)
  return (
    <form className={className} onSubmit={handleSubmitPurchase}>
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
            currentBid={currentBid}
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
          <div className={css.information}>
            <p className={css.infoHelpText}>
              {t('forms:fields.payWithCrypto.helpText')}
            </p>
            <p className={css.tutorial}>
              <span className={css.prompt}>
                {t('forms:fields.payWithCrypto.tutorial.prompt')}
              </span>
              <span>
                {t('forms:fields.payWithCrypto.tutorial.text')}
                <AppLink href="#">
                  {t('forms:fields.payWithCrypto.tutorial.hyperlink')}
                </AppLink>
              </span>
            </p>
          </div>
          <div className={css.instructions}>
            <Heading level={2}>
              {t('forms:fields.payWithCrypto.instructions.label')}:
            </Heading>
            <ol>
              <li>{t('forms:fields.payWithCrypto.instructions.1')}</li>
              <li>{t('forms:fields.payWithCrypto.instructions.2')}</li>
              <li>
                {t('forms:fields.payWithCrypto.instructions.3', { price })}
              </li>
              <li>{t('forms:fields.payWithCrypto.instructions.4')}</li>
            </ol>
            <hr className={css.separator} />
          </div>
          {connected ? (
            <div className={css.connect}>
              <p>Selected account: {formatAccount(account)}</p>
              <Button onClick={disconnect}>Disconnect</Button>
            </div>
          ) : (
            <Button onClick={connect}>Connect</Button>
          )}
        </>
      )}

      {/* Price */}
      <div className={css.priceContainer}>
        <p className={css.priceLabel}>{t('release:Total')}</p>
        <p className={css.priceValue}>{formatCurrency(price, lang)}</p>
      </div>

      {/* Submit */}
      <Button
        className={css.submit}
        disabled={!connected || !account}
        fullWidth
        type="submit"
        variant="primary"
      >
        {isAuctionActive
          ? t('common:actions.Place Bid')
          : t('common:actions.Purchase')}
      </Button>
    </form>
  )
}
