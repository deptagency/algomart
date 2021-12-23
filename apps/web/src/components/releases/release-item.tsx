import { PackStatus, PackType, PublishedPack } from '@algomart/schemas'
import clsx from 'clsx'
import Image from 'next/image'
import useTranslation from 'next-translate/useTranslation'

import css from './release-item.module.css'

import Counter from '@/components/counter/counter'
import { useLocale } from '@/hooks/use-locale'
import { cmsImageLoader } from '@/utils/cms-image-loader'
import { formatCurrency } from '@/utils/format-currency'

export interface ReleaseItemProps {
  pack: PublishedPack
}

export default function ReleaseItem({ pack }: ReleaseItemProps) {
console.log(pack)
  const locale = useLocale()
  const { t } = useTranslation()

  const reserveMet =
    pack.type === PackType.Auction &&
    pack?.activeBid &&
    pack.activeBid >= pack.price

  return (
    <div className={css.root}>
      <div className="relative my-4 sm:my-0 cursor-pointer">
        <div className={`w-full relative h-80`}>
          <Image
            alt={pack.title}
            layout="fill"
            className=" transition-all hover:opacity-80 object-contain lg:object-cover w-full h-full"
            loader={cmsImageLoader}
            src={pack.image}
          />
        </div>
        <div className={css.subtitle}>
          {pack.subtitle}
        </div>
      </div>

      {/* Metadata for active auction pack */}
      {pack.type === PackType.Auction && pack.status === PackStatus.Active && (
        <div className={css.metadata}>
          <div className="flex flex-col">
            <div className={css.metadataLabel}>
              {reserveMet
                ? t('release:Current Bid')
                : t('release:Reserve Price')}
            </div>
            <div className={css.metadataValue}>
              {reserveMet
                ? formatCurrency(pack.activeBid ?? 0, locale)
                : t('release:Not Met')}
            </div>
          </div>
          <div className="flex flex-col">
            <div className={css.metadataLabel}>{t('release:Ending In')}</div>
            <div className={css.metadataValue}>
              <Counter
                plainString
                target={new Date(pack.auctionUntil as string)}
              />
            </div>
          </div>
        </div>
      )}

      {/* Metadata for expired auction pack */}
      {pack.type === PackType.Auction && pack.status === PackStatus.Expired && (
        <div className={css.metadata}>
          <div className="flex flex-col">
            <div className={css.metadataLabel}>
              {reserveMet
                ? t('release:Winning Bid')
                : t('release:Reserve Price')}
            </div>
            <div className={css.metadataValue}>
              {reserveMet
                ? formatCurrency(pack.activeBid ?? 0, locale)
                : t('release:Not Met')}
            </div>
          </div>
          <div className="flex flex-col">
            <div className={css.metadataLabel}>{t('release:Auction Has')}</div>
            <div className={css.metadataValue}>{t('release:Ended')}</div>
          </div>
        </div>
      )}

      {/* Metadata for upcoming auction pack */}
      {pack.type === PackType.Auction && pack.status === PackStatus.Upcoming && (
        <div className={clsx(css.metadata, css.full)}>
          <div className="flex flex-col">
            <div className={css.metadataLabel}>{t('release:Starting In')}</div>
            <div className={css.metadataValue}>
              <Counter
                plainString
                target={new Date(pack.releasedAt as string)}
              />
            </div>
          </div>
        </div>
      )}

      {/* Metadata for purchasable pack */}
      {pack.type === PackType.Purchase && (
        // Purchase Data
        <div>
          <div className={clsx(css.metadata, css.full)}>
            <div className="flex flex-col">
              <div className={css.metadataLabel}>{pack.title}</div>
              <div className={css.metadataValue}>
                {formatCurrency(pack.price, locale)}
              </div>
            </div>
          </div>
          <div className="text-right mt-4 px-4">
              <span className="font-poppins text-sm text-blue-800">
                {t('release:N of N', {
                  available: pack.available,
                  total: pack.total,
                })}
                {t('release:Remaining')}
              </span>
          </div>
        </div>
      )}

      {/* Metadata for free pack */}
      {pack.type === PackType.Free && (
        <div className={clsx(css.metadata, css.full)}>
          <div className="flex flex-col">
            <div className={css.metadataLabel}>
              {pack.title}
            </div>
            <div className={css.metadataValue}>{t('common:statuses.Free')}</div>
          </div>
        </div>
      )}

      {/* Metadata for redeemable pack */}
      {pack.type === PackType.Redeem && (
        <div className={clsx(css.metadata, css.full)}>
          <div className="flex flex-col">
            <div className={css.metadataLabel}>
              {pack.title}
            </div>
            <div className={css.metadataValue}>
              {t('common:statuses.Redeemable')}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
