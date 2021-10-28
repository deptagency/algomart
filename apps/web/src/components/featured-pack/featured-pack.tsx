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
import { useLocale } from '@/hooks/useLocale'
import { formatCurrency } from '@/utils/format-currency'

export interface FeaturedPackProps {
  featuredPack: PublishedPack
  onClickFeatured: () => void
}

export default function HomeTemplate({
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

      {/* Columns */}
      <div className={css.featuredColumns}>
        {/* Image */}
        <div className={css.featuredImage}>
          <Image
            src={featuredPack.image}
            width={512}
            height={512}
            layout="responsive"
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

          {/* Remaining */}
          {featuredPack.type === PackType.Purchase ? (
            <p className={css.featuredAvailability}>
              <Trans
                i18nKey="release:N remaining of M"
                components={[
                  <span
                    key="available"
                    className={css.featuredAvailableNumber}
                  />,
                ]}
                values={{
                  available: featuredPack.available,
                  total: featuredPack.total,
                }}
              />
            </p>
          ) : null}

          {/* Actions */}
          <div className={css.featuredControls}>
            {isAuction && !isUpcoming && (
              <div className={css.columns}>
                {/* Left Column */}
                <div className={css.column}>
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
                </div>

                {/* Center Column */}
                <div className={css.column}>
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
                </div>

                {/* Right Column */}
                <div className={css.column}>
                  <>
                    <div className={css.metadataLabel}>
                      {isActive
                        ? t('release:Ending In')
                        : t('release:Auction Has')}
                    </div>
                    <div className={css.metadataValue}>
                      {isActive ? (
                        <Counter
                          plainString
                          target={new Date(featuredPack.auctionUntil as string)}
                        />
                      ) : (
                        t('release:Ended')
                      )}
                    </div>
                  </>
                </div>
              </div>
            )}
            {isAuction && (
              <Button fullWidth onClick={onClickFeatured}>
                {isActive
                  ? t('common:actions.Place Bid')
                  : t('common:actions.View Release')}
              </Button>
            )}
            {isPurchase && (
              <>
                <Button fullWidth onClick={onClickFeatured}>
                  {t('common:actions.Buy Now')}
                </Button>
                <p className={css.featuredPrice}>
                  {(featuredPack.type === PackType.Auction ||
                    featuredPack.type === PackType.Purchase) &&
                    formatCurrency(
                      featuredPack.activeBid ?? featuredPack.price,
                      locale
                    )}
                </p>
              </>
            )}
            {!isAuction && !isPurchase && (
              <Button fullWidth onClick={onClickFeatured}>
                {t('common:actions.Claim Now')}
              </Button>
            )}
          </div>
        </div>
      </div>
    </section>
  )
}
