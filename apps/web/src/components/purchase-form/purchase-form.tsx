import { CheckoutMethods, PublishedPack } from '@algomart/schemas'
import { ChevronRightIcon } from '@heroicons/react/outline'
import { Translate } from 'next-translate'
import useTranslation from 'next-translate/useTranslation'
import { useCallback, useState } from 'react'

import css from './card-form.module.css'

import Breadcrumbs from '@/components/breadcrumbs'
import Cards from '@/components/cards'
import CardForm from '@/components/purchase-form/cards/card-form'
import { usePaymentProvider } from '@/contexts/payment-context'

export interface PurchaseFormProps {
  auctionPackId: string | null
  currentBid: number | null
  release: PublishedPack
}

export default function PurchaseForm({
  auctionPackId,
  currentBid,
  release,
}: PurchaseFormProps) {
  const { t } = useTranslation()
  const [method, setMethod] = useState<CheckoutMethods | null>(null)

  const {
    formErrors,
    handleSubmitBid: onSubmitBid,
    handleSubmitPurchase: onSubmitPurchase,
    loadingText,
    packId,
    setStatus,
    status,
  } = usePaymentProvider({
    auctionPackId,
    currentBid,
    release,
  })

  const handleRetry = useCallback(() => {
    setStatus('form')
  }, [setStatus])

  const getCardList = (t: Translate) => [
    {
      handleClick: () => setMethod('card'),
      helpText: t('common:nav.social.Instagram'),
      icon: <ChevronRightIcon />,
      method: 'card',
      title: t('common:nav.social.Instagram'),
    },
    {
      handleClick: () => setMethod('wire'),
      helpText: t('common:nav.social.Instagram'),
      icon: <ChevronRightIcon />,
      method: 'wire',
      title: t('common:nav.social.Instagram'),
    },
  ]

  const getPaymentNavItems = (t: Translate) => [
    {
      label: t('common:nav.payment.Payment Methods'),
      handleClick: () => {
        setStatus('form')
        setMethod(null)
      },
    },
    {
      label: t('common:nav.payment.Payment Information'),
      handleClick: () => setStatus('form'),
    },
    {
      label: t('common:nav.payment.Summary'),
      handleClick: () => setStatus('summary'),
    },
  ]

  return (
    <section className={css.root}>
      {!method && <Cards cards={getCardList(t)} />}
      {method && <Breadcrumbs breadcrumbs={getPaymentNavItems(t)} />}
      {method === 'card' && (
        <CardForm
          auctionPackId={packId}
          currentBid={currentBid}
          release={release}
        />
      )}
    </section>
  )
}
