import { PackStatus, PackType, PublishedPack } from '@algomart/schemas'
import clsx from 'clsx'
import Image from 'next/image'
import useTranslation from 'next-translate/useTranslation'

import css from './release-item.module.css'

import Counter from '@/components/counter/counter'
import { useLocale } from '@/hooks/useLocale'
import { cmsImageLoader } from '@/utils/cms-image-loader'
import { formatCurrency } from '@/utils/format-currency'

export interface ReleaseItemProps {
  pack: PublishedPack
}

export default function ReleaseItem({ pack }: ReleaseItemProps) {
  const locale = useLocale()
  const { t } = useTranslation()

  const reserveMet =
    pack.type === PackType.Auction &&
    pack?.activeBid &&
    pack.activeBid >= pack.price

  return (
    <div className={css.root}>
      <div className={css.imageWrapper}>
        <Image
          alt={pack.title}
          height={250}
          layout="responsive"
          loader={cmsImageLoader}
          objectFit="contain"
          src={pack.image}
          width={250}
        />
      </div>
      <div className={css.content}>
        <div className={css.title}>{pack.title}</div>
      </div>

      {/* Metadata for active auction pack */}
      {pack.type === PackType.Auction && pack.status === PackStatus.Active && (
        <div className={css.metadata}>
          <div>
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
          <div>
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
          <div>
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
          <div>
            <div className={css.metadataLabel}>{t('release:Auction Has')}</div>
            <div className={css.metadataValue}>{t('release:Ended')}</div>
          </div>
        </div>
      )}

      {/* Metadata for upcoming auction pack */}
      {pack.type === PackType.Auction && pack.status === PackStatus.Upcoming && (
        <div className={clsx(css.metadata, css.full)}>
          <div>
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
        <div className={css.metadata}>
          <div>
            <div className={css.metadataLabel}>{t('release:Mint Cost')}</div>
            <div className={css.metadataValue}>
              {formatCurrency(pack.price, locale)}
            </div>
          </div>
          <div>
            <div className={css.metadataLabel}>{t('release:Remaining')}</div>
            <div className={css.metadataValue}>
              {t('release:N of N', {
                available: pack.available,
                total: pack.total,
              })}
            </div>
          </div>
        </div>
      )}

      {/* Metadata for free pack */}
      {pack.type === PackType.Free && (
        <div className={clsx(css.metadata, css.full)}>
          <div>
            <div className={css.metadataLabel}>
              {t('common:actions.Claim My Edition')}
            </div>
            <div className={css.metadataValue}>{t('common:statuses.Free')}</div>
          </div>
        </div>
      )}

      {/* Metadata for redeemable pack */}
      {pack.type === PackType.Redeem && (
        <div className={clsx(css.metadata, css.full)}>
          <div>
            <div className={css.metadataLabel}>
              {t('common:actions.Claim My Edition')}
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
