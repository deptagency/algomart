import {
  PackAuction,
  PackStatus,
  PackType,
  PublishedPack,
} from '@algomart/schemas'
import clsx from 'clsx'
import useTranslation from 'next-translate/useTranslation'

import css from './release-metadata.module.css'

import Counter from '@/components/counter/counter'
import { formatCurrency } from '@/utils/format-currency'

const { Active, Expired, Upcoming } = PackStatus
const { Auction, Free, Purchase, Redeem } = PackType

export interface ReleaseMetadataProps {
  packAuction: PackAuction | null
  packTemplate: PublishedPack
}

export default function ReleaseMetadata({
  packAuction,
  packTemplate,
}: ReleaseMetadataProps) {
  const { t, lang } = useTranslation()

  const highestBid = packAuction?.activeBid?.amount || 0
  const price = packTemplate.price || 0
  const startDateTime = packTemplate.releasedAt as string
  const isAuction = packTemplate.type === Auction

  const isActive = packTemplate.status === Active
  const isExpired = packTemplate.status === Expired
  const isUpcoming = packTemplate.status === Upcoming

  const isUpcomingAuction = isAuction && isUpcoming && startDateTime
  const isReserveMet = highestBid >= price

  // Upcoming auctions are treated uniquely as a full column counter
  if (isUpcomingAuction) {
    return (
      <div className={css.metadata}>
        <div className={css.column}>
          <div className={css.metadataLabel}>
            {t('release:Auction begins in')}
          </div>
          <div className={css.metadataValue}>
            <Counter
              includeDaysInPlainString
              plainString
              target={new Date(startDateTime)}
            />
          </div>
        </div>
      </div>
    )
  }

  return (
    <div
      className={clsx(css.metadata, {
        [css.active]: isActive,
        [css.metadataGrid]: !isUpcomingAuction,
      })}
    >
      {/* Left Column */}
      <div className={css.column}>
        {isAuction ? (
          <>
            <div className={css.metadataLabel}>
              {isActive
                ? t('release:Current Bid')
                : isReserveMet
                ? t('release:Winning Bid')
                : t('release:Highest Bid')}
            </div>
            <div
              className={clsx(css.metadataValue, {
                [css.completeSuccess]: isExpired && isReserveMet,
              })}
            >
              {formatCurrency(highestBid, lang)}
            </div>
          </>
        ) : (
          <div className={css.metadataValue}>
            {t('release:N of N editions available', {
              available: packTemplate.available,
              total: packTemplate.total,
            })}
          </div>
        )}
      </div>

      {/* Center Column */}
      <div className={css.column}>
        {isAuction ? (
          <>
            <div className={css.metadataLabel}>
              {t('release:Reserve Price')}
            </div>
            <div
              className={clsx(css.metadataValue, {
                [css.completeSuccess]: isReserveMet,
              })}
            >
              {isReserveMet ? t('release:Met') : t('release:Not Met')}
            </div>
          </>
        ) : (
          <div className={css.metadataValue}>
            {packTemplate.subtitle
              ? packTemplate.subtitle
              : isActive
              ? t('release:This sale is open')
              : t('release:This sale has ended')}
          </div>
        )}
      </div>

      {/* Right Column */}
      <div className={css.column}>
        {isAuction ? (
          <>
            <div className={css.metadataLabel}>
              {isActive ? t('release:Ending In') : t('release:Auction Has')}
            </div>
            <div className={css.metadataValue}>
              {isActive ? (
                <Counter
                  plainString
                  target={new Date(packTemplate.auctionUntil as string)}
                />
              ) : (
                t('release:Ended')
              )}
            </div>
          </>
        ) : (
          <div className={css.metadataValue}>
            {packTemplate.type === Purchase && formatCurrency(price, lang)}
            {packTemplate.type === Free && t('common:statuses.Free')}
            {packTemplate.type === Redeem && t('common:statuses.Redeemable')}
          </div>
        )}
      </div>
    </div>
  )
}
