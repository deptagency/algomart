import { PackStatus, PackType, PublishedPack } from '@algomart/schemas'
import clsx from 'clsx'
import Markdown from 'markdown-to-jsx'
import Image from 'next/image'
import Trans from 'next-translate/Trans'
import useTranslation from 'next-translate/useTranslation'

import css from './featured-pack.module.css'

import AppLink from '@/components/app-link/app-link'
import Button from '@/components/button'
import Counter from '@/components/counter/counter'
import Heading from '@/components/heading'
import { useLocale } from '@/hooks/use-locale'
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
    <section className="flex relative max-h-screen">
      <div className="absolute inset-0 overflow-hidden">
        <img
          src="/images/backgrounds/hero-background.png"
          alt=""
          className="w-full h-full object-center object-cover"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 z-10 space-y-10 md:space-x-20 mx-auto max-w-7xl px-4 py-24">
        <div className="col-span-1 md:col-span-5 mt-12">
          <div className="font-extrabold text-4xl text-white tracking-wide leading-tight pr-20">
            We connect passionate fans with 100% authenticated & original NFT
            collectibles.
          </div>
          <div className="text-white mt-4">
            In art, entertainment, memorabilia, & business.
          </div>
          <div className="mt-12 w-72">
            <AppLink
              className={
                'flex items-center justify-center px-4 py-3 border border-transparent font-semibold text-sm rounded-full shadow-sm text-gray-50 hover:cursor-pointer focus:outline-none bg-gradient-to-r from-green-400 to-blue-500 hover:sha active:shadow-inner font-poppins disabled:bg-gray-400 disabled:hover:bg-gray-400 disabled:cursor-not-allowed'
              }
              href={'/releases'}
              key={'/releases'}
            >
              Start Collecting
            </AppLink>
          </div>
        </div>
        <div className="col-span-1 md:col-span-7">
          {/* Top bar */}
          <div className="p-4 text-sm font-bold text-center text-white uppercase bg-gray-900 rounded-t-xl">
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
          <div className="sm:flex sm:flex-col sm:items-center bg-gray-900 rounded-b-xl">
            {/* Image */}
            <div className="sm:w-1/2 aspect-w-16 aspect-w-9">
              <Image
                src={featuredPack.image}
                className="rounded-xl"
                width={1024}
                height={1024}
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
                          {isReserveMet
                            ? t('release:Met')
                            : t('release:Not Met')}
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
                              target={
                                new Date(featuredPack.auctionUntil as string)
                              }
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
        </div>
      </div>
    </section>
  )
}
