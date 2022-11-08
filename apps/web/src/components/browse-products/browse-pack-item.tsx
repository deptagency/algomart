import { PackStatus, PackType, PublishedPack } from '@algomart/schemas'
import clsx from 'clsx'
import Image from 'next/image'
import useTranslation from 'next-translate/useTranslation'

import css from '@/components/browse-products/browse-product-item-common.module.css'

import AppLink from '@/components/app-link/app-link'
import Button from '@/components/button/button'
import Counter from '@/components/counter/counter'
import Credits from '@/components/currency/credits'
import Pill from '@/components/pill/pill'
import { useLocale } from '@/hooks/use-locale'
import { urlFor, urls } from '@/utils/urls'

export interface BrowsePackItemProps {
  pack: PublishedPack
}

export default function BrowsePackItem({ pack }: BrowsePackItemProps) {
  const { t } = useTranslation()
  const locale = useLocale()

  const reserveMet =
    pack.type === PackType.Auction &&
    pack?.activeBid &&
    pack.activeBid >= pack.price

  return (
    <AppLink href={urlFor(urls.releasePack, { packSlug: pack.slug })}>
      <div className={clsx(css.root, 'group')}>
        <div className={css.imageWrapper}>
          <Image
            alt={pack.title}
            height={250}
            layout="responsive"
            objectFit="cover"
            src={pack.image}
            width={250}
          />

          <Pill className={css.pricePill}>
            {pack.type === PackType.Free && t('common:statuses.Free')}
            {pack.type === PackType.Redeem && t('common:statuses.Redeemable')}
            {pack.type === PackType.Purchase && (
              <Credits parentheses value={pack.price} />
            )}
            {pack.type === PackType.Auction &&
              (reserveMet ? (
                <>
                  {t('release:Winning Bid')}:{' '}
                  <Credits parentheses value={pack.activeBid || 0} />
                </>
              ) : (
                <>
                  {t('release:Reserve Price')} {t('release:Not Met')}
                </>
              ))}
          </Pill>
        </div>

        <div className={css.metadata}>
          <div className={css.metadataFlexTop}>
            {/* Title (Nested div is required for styles) */}
            <h4 className={css.packTitle}>
              <div>{pack.title}</div>
            </h4>
            <div className="mb-2 text-sm line-clamp-2">{pack.body}</div>
          </div>
          <div className={css.metadataFlexBottom}>
            <div className={css.metadataPrice}></div>
            <Button className={css.metadataAction} variant="outline">
              {t('common:actions.View Pack')}
            </Button>

            <div className={css.metadataRemaining}>
              {pack.type === PackType.Auction ? (
                <>
                  {pack.status === PackStatus.Active && (
                    <>
                      {t('release:Ending In')}{' '}
                      <Counter
                        plainString
                        target={new Date(pack.auctionUntil as string)}
                      />
                    </>
                  )}
                  {pack.status === PackStatus.Expired && (
                    <>
                      {t('release:Ended On')}{' '}
                      {new Date(pack.auctionUntil).toLocaleString(locale, {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      })}
                    </>
                  )}
                  {pack.status === PackStatus.Upcoming && (
                    <>
                      {t('release:Starting In')}{' '}
                      <Counter
                        plainString
                        target={new Date(pack.releasedAt as string)}
                      />
                    </>
                  )}
                </>
              ) : (
                <div className={css.metadataRemaining}>
                  {t('release:N / N remaining', {
                    available: pack.available,
                    total: pack.total,
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </AppLink>
  )
}
