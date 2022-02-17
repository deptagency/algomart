import { CheckoutMethod, CheckoutStatus, PackType } from '@algomart/schemas'
import clsx from 'clsx'
import { useRouter } from 'next/router'
import useTranslation from 'next-translate/useTranslation'
import { FormEvent, useCallback } from 'react'

import CardPurchaseForm from './sections/card-form'
import CardPurchaseHeader from './sections/card-header'
import CardPurchaseSummary from './sections/card-summary'

import css from './card-form.module.css'

import Loading from '@/components/loading/loading'
import Failure from '@/components/purchase-form/shared/failure'
import Success from '@/components/purchase-form/shared/success'
import { PaymentContextProps } from '@/contexts/payment-context'
import { useWarningOnExit } from '@/hooks/use-warning-on-exit'
import { isAfterNow } from '@/utils/date-time'
import { urls } from '@/utils/urls'

export default function CardForm({
  bid,
  countries,
  release,
  formErrors,
  handleRetry,
  handleSubmitBid: onSubmitBid,
  handleSubmitPurchase: onSubmitPurchase,
  loadingText,
  packId,
  price,
  promptLeaving,
  setBid,
  setPromptLeaving,
  status,
}: PaymentContextProps) {
  const { t } = useTranslation()
  const { asPath, push } = useRouter()
  const isAuctionActive =
    release?.type === PackType.Auction &&
    isAfterNow(new Date(release.auctionUntil as string))
  useWarningOnExit(promptLeaving, t('common:statuses.processingPayment'))

  const handleSubmitPurchase = useCallback(
    async (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault()
      setPromptLeaving(true)
      const data = new FormData(event.currentTarget)
      await (release?.type === PackType.Auction &&
      isAfterNow(new Date(release.auctionUntil as string))
        ? onSubmitBid(data, CheckoutMethod.card)
        : onSubmitPurchase(data, true))
      setPromptLeaving(false)
    },
    [
      release?.type,
      release.auctionUntil,
      onSubmitBid,
      onSubmitPurchase,
      setPromptLeaving,
    ]
  )

  const handlePackOpening = useCallback(() => {
    const path = urls.packOpening.replace(':packId', packId)
    if (typeof window !== 'undefined') {
      window.location.assign(new URL(path, window.location.origin).href)
    }
  }, [packId])

  const handleCompleteAuction = useCallback(
    () =>
      push(
        isAuctionActive
          ? urls.release.replace(':packSlug', release.slug)
          : urls.myCollectibles
      ),
    [isAuctionActive, push, release?.slug]
  )

  return (
    <section className={css.root}>
      <CardPurchaseHeader title={release.title} image={release.image} />

      <form
        className={clsx(
          css.form,
          status === CheckoutStatus.form || status === CheckoutStatus.summary
            ? 'w-full'
            : 'hidden'
        )}
        onSubmit={handleSubmitPurchase}
      >
        <CardPurchaseForm
          bid={bid}
          className={status === CheckoutStatus.form ? 'w-full' : 'hidden'}
          countries={countries}
          formErrors={formErrors}
          isAuctionActive={isAuctionActive}
          setBid={setBid}
          handleContinue={() => push(`${asPath.split('?')[0]}?step=summary`)}
        />
        {status === CheckoutStatus.summary && (
          <CardPurchaseSummary
            isAuctionActive={isAuctionActive}
            price={price}
            release={release}
          />
        )}
      </form>

      {status === CheckoutStatus.loading && (
        <Loading loadingText={loadingText} variant="primary" />
      )}

      {status === CheckoutStatus.success && packId && (
        <Success
          buttonText={
            release?.type === PackType.Auction && isAuctionActive
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
            release?.type === PackType.Auction && isAuctionActive
              ? t('common:statuses.Bid placed!')
              : t('common:statuses.Success!')
          }
          notice={
            release?.type === PackType.Auction &&
            isAuctionActive &&
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
