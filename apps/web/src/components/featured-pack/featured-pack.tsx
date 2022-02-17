import { PackStatus, PackType, PublishedPack } from '@algomart/schemas'
import clsx from 'clsx'
import Markdown from 'markdown-to-jsx'
import Image from 'next/image'
import Trans from 'next-translate/Trans'
import useTranslation from 'next-translate/useTranslation'

import css from './featured-pack.module.css'

import Button from '@/components/button'
import Counter from '@/components/counter/counter'
import Heading from '@/components/heading'
import { useLocale } from '@/hooks/use-locale'
import { formatCurrency } from '@/utils/format-currency'

export interface FeaturedPackProps {
  featuredPack: PublishedPack
  banner?: string
  subtitle?: string
  title?: string
  onClickFeatured: () => void
}

export default function HomeTemplate({
  banner,
  subtitle,
  title,
  featuredPack,
  onClickFeatured,
}: FeaturedPackProps) {
  const locale = useLocale()
  const { t, lang } = useTranslation()

  const highestBid = featuredPack?.activeBid || 0
  const isReserveMet = highestBid >= featuredPack.price || 0
  const isAuction = featuredPack.type === PackType.Auction
  const isPurchase = featuredPack.type === PackType.Purchase
  const isActive = featuredPack.status === PackStatus.Active
  const isExpired = featuredPack.status === PackStatus.Expired
  const isUpcoming = featuredPack.status === PackStatus.Upcoming
  banner = undefined

  return (
    <section className={css.featured}>
      {/* Top bar */}
      <div className={css.featuredNotice}>
        {isAuction ? (
          <>
            {isActive && (
              <>
                {t('release:Live auction ends in')}{' '}
                <Counter
                  plainString
                  includeDaysInPlainString
                  target={new Date(featuredPack.auctionUntil || Date.now())}
                />
              </>
            )}
            {isExpired && t('release:Auction is now closed')}
            {isUpcoming && (
              <>
                {t('release:Live auction starts in')}:{' '}
                <Counter
                  plainString
                  includeDaysInPlainString
                  target={new Date(featuredPack.releasedAt || Date.now())}
                />
              </>
            )}
          </>
        ) : (
          t('release:Limited Edition N Remaining', {
            available: featuredPack.available,
          })
        )}
      </div>

      <section
        className={css.banner}
        style={{
          backgroundImage: banner ? `url("${banner}")` : 'none',
        }}
      >
        {/* Columns */}
        <div className={css.featuredColumns}>
          {/* Image */}
          <div className={css.featuredImage}>
            <Image
              alt={featuredPack.title}
              src={featuredPack.image}
              width={512}
              height={512}
              layout="responsive"
              objectFit="cover"
            />
          </div>

          {/* Content */}
          <div className={css.featuredContent}>
            <Heading className={css.featuredHeading} level={2} bold>
              {featuredPack.title}
            </Heading>
            {featuredPack.body ? (
              <div className={css.featuredBody}>
                <Markdown options={{ forceBlock: true }}>
                  {featuredPack.body}
                </Markdown>
              </div>
            ) : null}

            {/* Actions */}
            <div className={css.featuredControls}>
              {isPurchase && (
                <>
                  <Button fullWidth onClick={onClickFeatured}>
                    {t('common:actions.Buy Now')}
                  </Button>
                </>
              )}
              {!isPurchase && (
                <Button fullWidth onClick={onClickFeatured}>
                  {t('common:actions.Claim Now')}
                </Button>
              )}
            </div>
          </div>
        </div>
      </section>
    </section>
  )
}
