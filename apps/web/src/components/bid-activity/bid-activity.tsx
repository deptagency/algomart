import { BidPublic } from '@algomart/schemas'
import { UserCircleIcon } from '@heroicons/react/outline'
import Image from 'next/image'
import useTranslation from 'next-translate/useTranslation'
import React from 'react'

import BidActivityDetails from './sections/bid-activity-details'
import BidActivityEmoji from './sections/bid-activity-emoji'

import css from './bid-activity.module.css'

import { useI18n } from '@/contexts/i18n-context'
import { useCurrency } from '@/hooks/use-currency'
import { useLocale } from '@/hooks/use-locale'
import { isAfterNow, isNowBetweenDates } from '@/utils/date-time'
import { formatCurrency, isGreaterThanOrEqual } from '@/utils/format-currency'

export interface BidActivityProps {
  avatars: { [key: string]: string | null }
  auctionUntil: string
  bids: BidPublic[]
  releasedAt: string
  reservePrice?: number
  winningBidUserName?: string | null
}

export default function BidActivity({
  avatars,
  auctionUntil,
  bids,
  releasedAt,
  reservePrice,
  winningBidUserName,
}: BidActivityProps) {
  const locale = useLocale()
  const currency = useCurrency()
  const { conversionRate } = useI18n()
  const { t, lang } = useTranslation()
  const startDateTime = new Date(releasedAt)
  const endDateTime = new Date(auctionUntil)

  const isActive = isNowBetweenDates(startDateTime, endDateTime)
  const isClosed = !isAfterNow(endDateTime)
  const winningUser = isClosed && winningBidUserName ? winningBidUserName : null
  const dateFormat = new Intl.DateTimeFormat([locale], {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
  const timeFormat = new Intl.DateTimeFormat([locale], { timeStyle: 'short' })
  const startAtReadable = t('release:packActivityDate', {
    date: dateFormat.format(startDateTime),
    time: timeFormat.format(startDateTime),
  })
  const endAtReadable = t('release:packActivityDate', {
    date: dateFormat.format(endDateTime),
    time: timeFormat.format(endDateTime),
  })
  return (
    <section className={css.bidActivity}>
      <h1 className={css.title}>{t('release:Activity')}</h1>
      <ul className={css.list}>
        {isClosed && auctionUntil && (
          <BidActivityDetails
            content={t('release:Auction is now closed')}
            date={endAtReadable}
            amount={null}
          >
            <BidActivityEmoji label={t('release:emojiFlag')} symbol="🏁" />
          </BidActivityDetails>
        )}
        {winningUser && auctionUntil && (
          <BidActivityDetails
            content={t('release:Auction won by', { username: winningUser })}
            date={endAtReadable}
            amount={null}
          >
            <BidActivityEmoji label={t('release:emojiTrophy')} symbol="🏆" />
          </BidActivityDetails>
        )}
        {bids.map((bid, index) => {
          const avatar = avatars[bid.externalId]
          const createdAtDateTime = new Date(bid.createdAt)
          const meetsReservePrice =
            !!reservePrice &&
            isGreaterThanOrEqual(bid.amount, reservePrice, currency)
          const followingBid = bids[index + 1]
          const followingBidDoesNotMeetReservePrice =
            reservePrice &&
            !!followingBid &&
            !isGreaterThanOrEqual(followingBid.amount, reservePrice, currency)
          return (
            <React.Fragment key={bid.id}>
              <BidActivityDetails
                amount={formatCurrency(
                  bid.amount,
                  lang,
                  currency,
                  conversionRate
                )}
                content={t('release:Bid placed by', { username: bid.username })}
                date={t('release:packActivityDate', {
                  date: dateFormat.format(createdAtDateTime),
                  time: timeFormat.format(createdAtDateTime),
                })}
              >
                {/* TODO */}
                {avatar ? (
                  <Image
                    alt={t('release:bidderProfile')}
                    src={avatar}
                    layout="responsive"
                    height="100%"
                    width="100%"
                  />
                ) : (
                  <UserCircleIcon className={css.avatarGeneric} />
                )}
              </BidActivityDetails>
              {meetsReservePrice &&
                (!followingBid || followingBidDoesNotMeetReservePrice) && (
                  <BidActivityDetails
                    amount={null}
                    content={t('release:Reserve price met')}
                    date={t('release:packActivityDate', {
                      date: dateFormat.format(createdAtDateTime),
                      time: timeFormat.format(createdAtDateTime),
                    })}
                  >
                    <BidActivityEmoji
                      label={t('release:emojiTicket')}
                      symbol="🏷"
                    />
                  </BidActivityDetails>
                )}
            </React.Fragment>
          )
        })}
        {isActive && releasedAt && (
          <BidActivityDetails
            amount={null}
            content={t('release:Auction is now live')}
            date={startAtReadable}
          >
            <BidActivityEmoji label={t('release:emojiRocket')} symbol="🚀" />
          </BidActivityDetails>
        )}
      </ul>
    </section>
  )
}
