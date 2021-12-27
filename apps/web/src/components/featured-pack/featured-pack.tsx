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
    <section className="flex relative md:mt-0 mt-16 bg-blue-1000">
      <div className="absolute inset-0 overflow-hidden opacity-75 flex from-transparent via-transparent to-blue-200 bg-gradient-to-br top-40">
        <img
          src="/images/backgrounds/background-wave.svg"
          alt=""
          className="w-full object-center object-cover"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 z-10 mx-auto max-w-screen-2xl pt-12 pb-20">
        <div className="col-span-1 md:col-span-7 md:mt-12 mt-2 flex flex-col justify-center ml-4 md:ml-12">
          <div
            className={clsx(
              css.blueStrockeText,
              'font-extrabold lg:text-7xl md:text-5xl sm:text-4xl text-5xl tracking-wide leading-tight pr-20 text-opacity-20 text-blue-800'
            )}
          >
            Buy, Sell & Trade Authentic NFTs.
          </div>
          <div
            className={clsx(
              css.grayStrockeText,
              'text-transparent md:text-3xl text-2xl font-bold mt-4'
            )}
          >
            Built by the passionate for the passionate
            <ul className="list-none">
              <li>- Carbon Neutral</li>
              <li>- Fees as low as $0.001</li>
              <li>- Multi-crypto and fiat supported</li>
            </ul>
          </div>
          <div className="mt-12 w-72 mx-auto md:ml-0">
            <AppLink
              className={
                'flex items-center justify-center px-4 py-3 border border-blue-500 font-semibold text-sm rounded-full shadow-sm text-gray-50 hover:cursor-pointer focus:outline-none bg-gradient-to-r from-green-400 to-blue-500 hover:sha active:shadow-inner font-poppins disabled:bg-gray-400 disabled:hover:bg-gray-400 disabled:cursor-not-allowed'
              }
              href={'/releases'}
              key={'/releases'}
            >
              Start Collecting
            </AppLink>
          </div>
        </div>
        <div className="col-span-1 md:col-span-5">
          {/* Columns */}
          <div className="sm:flex sm:flex-col sm:items-center rounded-xl relative">
            {/* Image */}
            <div
              className={clsx(
                css.dropshadow,
                'w-full md:w-4/5 aspect-w-16 aspect-w-9 mt-6'
              )}
            >
              <Image
                src={featuredPack.image}
                className="rounded-xl"
                width={500}
                height={700}
                layout="responsive"
                objectFit="cover"
              />
            </div>

            {/* Content */}
            <div className="bg-gray-900 bg-opacity-75 rounded-xl md:relative lg:absolute relative md:-bottom-20 lg:-bottom-12 md:w-4/5 py-4 px-8 mx-4">
              <Heading
                className="text-blue-800 lg:text-2xl md:text-xl mb-4"
                level={2}
                bold
              >
                {featuredPack.title}
              </Heading>

              {/* CTA bar */}
              <div className="p-4 text-sm font-bold text-center text-white uppercase bg-yellow-400 bg-opacity-40 rounded">
                {isAuction ? (
                  <>
                    {isActive && (
                      <>
                        {t('release:Live auction ends in')}{' '}
                        <Counter
                          plainString
                          includeDaysInPlainString
                          target={
                            new Date(featuredPack.auctionUntil || Date.now())
                          }
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
                          target={
                            new Date(featuredPack.releasedAt || Date.now())
                          }
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

              {/* Remaining */}
              {/* {featuredPack.type === PackType.Purchase ? (
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
              ) : null} */}

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
                    <p className="text-blue-800 text-2xl my-4 font-bold text-center">
                      {(featuredPack.type === PackType.Auction ||
                        featuredPack.type === PackType.Purchase) &&
                        formatCurrency(
                          featuredPack.activeBid ?? featuredPack.price,
                          locale
                        )}
                    </p>
                    <Button onClick={onClickFeatured} fullWidth size="small">
                      {t('common:actions.Buy Now')}
                    </Button>
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
