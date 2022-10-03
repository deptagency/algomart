import { BidPublic } from '@algomart/schemas'
import useTranslation from 'next-translate/useTranslation'
import React from 'react'

import Avatar from '../avatar/avatar'

import BidActivityDetails from './sections/bid-activity-details'
import BidActivityEmoji from './sections/bid-activity-emoji'

import css from './bid-activity.module.css'

import { useLocale } from '@/hooks/use-locale'
import { isAfterNow, isNowBetweenDates } from '@/utils/date-time'

export interface BidActivityProps {
  auctionUntil: string
  bids: BidPublic[]
  releasedAt: string
  reservePrice?: number
  winningBidUserName?: string | null
}

export default function BidActivity({
  auctionUntil,
  bids,
  releasedAt,
  reservePrice,
  winningBidUserName,
}: BidActivityProps) {
  const locale = useLocale()
  const { t } = useTranslation()
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
          >
            <BidActivityEmoji label={t('release:emojiFlag')} symbol="🏁" />
          </BidActivityDetails>
        )}
        {winningUser && auctionUntil && (
          <BidActivityDetails
            content={t('release:Auction won by', { username: winningUser })}
            date={endAtReadable}
          >
            <BidActivityEmoji label={t('release:emojiTrophy')} symbol="🏆" />
          </BidActivityDetails>
        )}
        {bids.map((bid, index) => {
          const createdAtDateTime = new Date(bid.createdAt)
          const meetsReservePrice = !!reservePrice && bid.amount >= reservePrice
          const followingBid = bids[index + 1]
          const followingBidDoesNotMeetReservePrice =
            reservePrice && !!followingBid && followingBid.amount < reservePrice
          return (
            <React.Fragment key={bid.id}>
              <BidActivityDetails
                amount={bid.amount}
                content={t('release:Bid placed by', { username: bid.username })}
                date={t('release:packActivityDate', {
                  date: dateFormat.format(createdAtDateTime),
                  time: timeFormat.format(createdAtDateTime),
                })}
              >
                <Avatar username={bid.username} />
              </BidActivityDetails>
              {meetsReservePrice &&
                (!followingBid || followingBidDoesNotMeetReservePrice) && (
                  <BidActivityDetails
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
