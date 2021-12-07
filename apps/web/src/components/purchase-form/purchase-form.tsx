import { CreditCardIcon, LibraryIcon } from '@heroicons/react/outline'
import { Translate } from 'next-translate'
import useTranslation from 'next-translate/useTranslation'

import css from './purchase-form.module.css'

import Breadcrumbs from '@/components/breadcrumbs'
import Cards from '@/components/cards'
import CardForm from '@/components/purchase-form/cards/card-form'
import { PaymentContextProps } from '@/contexts/payment-context'

export default function PurchaseForm({
  method,
  setMethod,
  setStatus,
  status,
  ...rest
}: PaymentContextProps) {
  const { t } = useTranslation()

  const getCardList = (t: Translate) => [
    {
      handleClick: () => setMethod('card'),
      helpText: t('forms:fields.paymentMethods.options.card.helpText'),
      icon: <CreditCardIcon className={css.icon} />,
      method: 'card',
      title: t('forms:fields.paymentMethods.options.card.label'),
    },
    {
      handleClick: () => setMethod('wire'),
      helpText: t('forms:fields.paymentMethods.options.wire.helpText'),
      icon: <LibraryIcon className={css.icon} />,
      method: 'wire',
      title: t('forms:fields.paymentMethods.options.wire.label'),
    },
  ]

  const getPaymentNavItems = (t: Translate) => [
    {
      label: t('common:nav.payment.Payment Methods'),
      isActive: false,
      isDisabled: false,
      handleClick: () => {
        setStatus('form')
        setMethod(null)
      },
    },
    {
      label: t('common:nav.payment.Payment Information'),
      isActive: status === 'form',
      isDisabled: !method,
      handleClick: () => setStatus('form'),
    },
    {
      label: t('common:nav.payment.Summary'),
      isActive: status === 'summary',
      isDisabled: status !== 'summary',
      handleClick: () => setStatus('summary'),
    },
  ]

  return (
    <section className={css.root}>
      {/* Select method */}
      {method ? (
        <Breadcrumbs breadcrumbs={getPaymentNavItems(t)} />
      ) : (
        <Cards
          header={t('forms:fields.paymentMethods.helpText')}
          cards={getCardList(t)}
        />
      )}
      {/* Credit cards */}
      {method === 'card' && (
        <CardForm
          method={method}
          setMethod={setMethod}
          setStatus={setStatus}
          status={status}
          {...rest}
        />
      )}
    </section>
  )
}
