import clsx from 'clsx'
import Trans from 'next-translate/Trans'
import useTranslation from 'next-translate/useTranslation'
import { FormEvent } from 'react'

import css from './purchase-with-credits-form.module.css'

import Button from '@/components/button'
import Credits from '@/components/currency/credits'
import PendingCredits from '@/components/currency/pending-credits'
import CurrencyInput from '@/components/currency-input/currency-input'

export interface PurchaseWithCreditsFormProps {
  balance?: number
  buyLabel?: string
  className?: string
  handleSubmit?: (event: FormEvent) => Promise<void>
  price: number
}

export default function PurchaseWithCreditsForm({
  balance,
  buyLabel,
  handleSubmit,
  price,
}: PurchaseWithCreditsFormProps) {
  const { t } = useTranslation()

  return (
    <section className={css.root}>
      <form className={clsx(css.form)} onSubmit={handleSubmit}>
        <div className={clsx(css.formSection)}>
          <>
            {/* Price */}
            <CurrencyInput
              readOnly
              label={t('forms:fields.payWithBalance.price')}
              name="price"
              value={price || 0}
            />

            {/* Credit Balance */}
            <CurrencyInput
              className={css.balance}
              readOnly
              label={t('forms:fields.payWithBalance.balance')}
              name="credits"
              value={balance || 0}
            />

            <PendingCredits className={css.pending} />

            <div className={css.information}>
              <Trans
                components={[<Credits key={0} parentheses value={price} />]}
                i18nKey="forms:fields.payWithBalance.information.prompt"
              />
            </div>
          </>

          {/* Submit */}
          <Button
            data-e2e="credits-form-buy"
            className={css.continueButton}
            disabled={!price}
            fullWidth
            type="submit"
            size="large"
          >
            {buyLabel || t('forms:fields.payWithBalance.buy')}
          </Button>
        </div>
      </form>
    </section>
  )
}
