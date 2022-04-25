import { CheckoutMethod, CheckoutStatus, PackType } from '@algomart/schemas'
import clsx from 'clsx'
import { useRouter } from 'next/router'
import useTranslation from 'next-translate/useTranslation'
import { FormEvent, useCallback } from 'react'

import CardPurchaseForm from './sections/card-form'
import CardHeader from './sections/card-header'
import CardSummary from './sections/card-summary'

import css from './card-form.module.css'

import Loading from '@/components/loading/loading'
import Failure from '@/components/purchase-form/shared/failure'
import Success from '@/components/purchase-form/shared/success'
import { usePaymentContext } from '@/contexts/payment-context'
import { useWarningOnExit } from '@/hooks/use-warning-on-exit'
import { isAfterNow } from '@/utils/date-time'
import { urlFor, urls } from '@/utils/urls'

export default function CardForm() {
  const { t } = useTranslation()
  const { asPath, push } = useRouter()
  const {
    isAuctionActive,
    release,
    handleRetry,
    handleSubmitBid,
    handleSubmitPurchase,
    loadingText,
    packId,
    promptLeaving,
    setPromptLeaving,
    status,
  } = usePaymentContext()
  useWarningOnExit(promptLeaving, t('common:statuses.processingPayment'))

  const handleSubmit = useCallback(
    async (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault()
      setPromptLeaving(true)
      const data = new FormData(event.currentTarget)
      await (release?.type === PackType.Auction &&
      isAfterNow(new Date(release.auctionUntil as string))
        ? handleSubmitBid(data, CheckoutMethod.card)
        : handleSubmitPurchase(data, true))
      setPromptLeaving(false)
    },
    [
      release?.type,
      release.auctionUntil,
      handleSubmitBid,
      handleSubmitPurchase,
      setPromptLeaving,
    ]
  )

  const handlePackOpening = useCallback(() => {
    if (typeof window !== 'undefined') {
      const path = urlFor(urls.packOpening, { packId })
      window.location.assign(new URL(path, window.location.origin).href)
    }
  }, [packId])

  const handleCompleteAuction = useCallback(
    () =>
      push(
        isAuctionActive()
          ? urlFor(urls.products, { packSlug: release.slug })
          : urls.myCollectibles
      ),
    [isAuctionActive, push, release?.slug]
  )

  return (
    <section className={css.root}>
      <CardHeader title={release.title} image={release.image} />

      <form
        className={clsx(
          css.form,
          status === CheckoutStatus.form || status === CheckoutStatus.summary
            ? 'w-full'
            : 'hidden'
        )}
        onSubmit={handleSubmit}
      >
        <CardPurchaseForm
          className={status === CheckoutStatus.form ? 'w-full' : 'hidden'}
          handleContinue={() => push(`${asPath.split('?')[0]}?step=summary`)}
        />
        {status === CheckoutStatus.summary && <CardSummary />}
      </form>

      {status === CheckoutStatus.loading && (
        <Loading loadingText={loadingText} />
      )}

      {status === CheckoutStatus.success && packId && (
        <Success
          buttonText={
            release?.type === PackType.Auction && isAuctionActive()
              ? t('common:actions.Back to Listing')
              : release?.type === PackType.Auction
              ? t('common:actions.View My Collection')
              : t('common:actions.Open Pack')
          }
          handleClick={
            release?.type === PackType.Auction
              ? handleCompleteAuction
              : handlePackOpening
          }
          headingClassName={release?.type === PackType.Purchase && 'mb-16'}
          headingText={
            release?.type === PackType.Auction && isAuctionActive()
              ? t('common:statuses.Bid placed!')
              : t('common:statuses.Success!')
          }
          notice={
            release?.type === PackType.Auction &&
            isAuctionActive() &&
            t('forms:fields.bid.success', { title: release.title })
          }
        />
      )}

      {status === CheckoutStatus.error && (
        <Failure
          buttonText={t('common:actions.Try Again')}
          error={t('forms:errors.failedPayment')}
          handleClick={handleRetry}
          headingText={t('release:failedToClaim')}
        />
      )}
    </section>
  )
}
