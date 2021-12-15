import useTranslation from 'next-translate/useTranslation'

import css from './crypto-form.module.css'

import AppLink from '@/components/app-link/app-link'
import Heading from '@/components/heading'
import { formatCurrency } from '@/utils/format-currency'

export interface CryptoFormInstructionsProps {
  price: string | null
}

export default function CryptoFormInstructions({
  price,
}: CryptoFormInstructionsProps) {
  const { t, lang } = useTranslation()
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
          <li>
            {t('forms:fields.payWithCrypto.instructions.2', {
              price: formatCurrency(price, lang),
            })}
          </li>
          <li>{t('forms:fields.payWithCrypto.instructions.3')}</li>
          <li>{t('forms:fields.payWithCrypto.instructions.4')}</li>
        </ol>
        <hr className={css.separator} />
      </div>
    </>
  )
}
