import useTranslation from 'next-translate/useTranslation'
import { useCallback, useState } from 'react'

import css from './crypto-form.module.css'

import Button from '@/components/button'
import Heading from '@/components/heading'
import WalletInstructionsModal from '@/components/modals/wallet-instructions'
import { useI18n } from '@/contexts/i18n-context'
import { useCurrency } from '@/hooks/use-currency'
import { useLocale } from '@/hooks/use-locale'
import { formatCurrency } from '@/utils/currency'

export interface CryptoFormInstructionsProps {
  price: number
}

export default function CryptoFormInstructions({
  price,
}: CryptoFormInstructionsProps) {
  const locale = useLocale()
  const { t } = useTranslation()
  const currency = useCurrency()
  const { conversionRate } = useI18n()
  const [open, setOpen] = useState(false)

  const onClose = useCallback(() => {
    setOpen(false)
  }, [])

  const onOpen = useCallback(() => {
    setOpen(true)
  }, [])
  return (
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
            <Button
              className={css.openButton}
              onClick={onOpen}
              variant="tertiary"
            >
              {t('forms:fields.payWithCrypto.tutorial.hyperlink')}.
            </Button>
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
            {t('forms:fields.payWithCrypto.instructions.3', {
              price: formatCurrency(price, locale, currency, conversionRate),
              usdcPrice: formatCurrency(price),
              currency,
            })}
          </li>
          <li>{t('forms:fields.payWithCrypto.instructions.4')}</li>
        </ol>
        <hr className={css.separator} />
      </div>
      <WalletInstructionsModal onClose={onClose} open={open} />
    </>
  )
}
