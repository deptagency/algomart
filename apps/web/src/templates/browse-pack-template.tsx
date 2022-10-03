import {
  PackAuction,
  PackStatus,
  PackType,
  PublishedPack,
} from '@algomart/schemas'
import Image from 'next/image'
import { useRouter } from 'next/router'
import useTranslation from 'next-translate/useTranslation'
import { useState } from 'react'

import css from './browse-pack-template.module.css'

import BidActivity from '@/components/bid-activity/bid-activity'
import Button from '@/components/button'
import Counter from '@/components/counter/counter'
import Credits from '@/components/currency/credits'
import { H1, H2 } from '@/components/heading'
import LinkButton from '@/components/link-button'
import ClaimNFTModal from '@/components/modals/claim-nft-modal'
import { useAuth } from '@/contexts/auth-context'
import { isBeforeNow } from '@/utils/date-time'
import { urlFor, urls } from '@/utils/urls'

export interface BrowsePackTemplateProps {
  disallowBuyOrClaim: boolean | null
  handleClaimNFT: (redeemCode: string) => Promise<{ packId: string } | string>
  isOwner: boolean | null
  isWinningBidder: boolean | null
  packAuction: PackAuction | null
  packTemplate: PublishedPack
}

export default function BrowsePackTemplate({
  disallowBuyOrClaim,
  handleClaimNFT,
  isOwner,
  isWinningBidder,
  packAuction,
  packTemplate,
}: BrowsePackTemplateProps) {
  const { t } = useTranslation()
  const auth = useAuth()
  const { push, asPath } = useRouter()
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false)

  const hasReleased =
    packTemplate.releasedAt && isBeforeNow(new Date(packTemplate.releasedAt))
  const packType = packTemplate.type
  const releaseIsAvailable = packTemplate.available > 0
  const imageUrls = packTemplate.showNfts
    ? packTemplate.collectibleTemplates.map((ct) => ct.image)
    : Array.from({ length: packTemplate.nftsPerPack }).map(
        () => '/images/textures/nft-placeholder.jpg'
      )

  const handleClaimNFTFlow = () => {
    packType === PackType.Purchase || packType === PackType.Auction
      ? push(urlFor(urls.checkoutPack, { packSlug: packTemplate.slug }))
      : setIsModalOpen(!isModalOpen)
  }

  const getCtaText = () => {
    if (packType === PackType.Purchase) return t('common:actions.Buy Now')
    if (packType === PackType.Auction) {
      if (isOwner) return t('common:actions.View My Collection')
      if (packTemplate.status === PackStatus.Expired && isWinningBidder)
        return t('common:actions.Claim NFT')
      return t('common:actions.Place Bid')
    }
    return t('common:actions.Claim My Edition')
  }

  const ReleaseCTA = () => {
    if (!auth.user && !auth.isAuthenticating) {
      return (
        <LinkButton
          variant="secondary"
          href={`${urls.loginEmail}?redirect=${asPath}`}
        >
          {t('release:joinNowToStartCollecting')}
        </LinkButton>
      )
    }
    if (!releaseIsAvailable) {
      return (
        <p className={css.actionNotAllowed}>{t('release:noLongerAvailable')}</p>
      )
    }
    if (disallowBuyOrClaim) {
      return (
        <p className={css.actionNotAllowed}>{t('release:limit1PerCustomer')}</p>
      )
    }
    return (
      <Button
        data-e2e={
          packType === PackType.Purchase ? 'buy-now-button' : 'claim-button'
        }
        variant={isWinningBidder || isOwner ? 'accent' : 'primary'}
        size="large"
        onClick={handleClaimNFTFlow}
        disabled={packType === PackType.Auction}
      >
        {getCtaText()}
      </Button>
    )
  }

  return (
    <div className={css.root}>
      <div className={css.packCard}>
        <div className={css.packImage}>
          <Image
            alt={t('common:statuses.Selected Image')}
            layout="responsive"
            src={packTemplate.image}
            objectFit="contain"
            width={400}
            height={400}
            priority
          />
        </div>

        <div className={css.container}>
          <div className={css.packDetails}>
            <div
              data-e2e="pack-template-info"
              className={css.titleAndDescription}
            >
              <H1 uppercase className={css.title}>
                {packTemplate.title}
              </H1>
              {packTemplate.subtitle && (
                <H2 size={4} mt={2}>
                  {packTemplate.subtitle}
                </H2>
              )}
              {packTemplate.body && <p className="mt-2">{packTemplate.body}</p>}
            </div>
            <div className={css.actions}>
              <div className={css.actionItem}>
                {packTemplate.available ? (
                  <h4>{`${packTemplate.available} ${t(
                    'common:statuses.Available'
                  )}`}</h4>
                ) : (
                  <h4>Info Unavailable</h4>
                )}
              </div>

              <div className={css.middleAction}>
                {hasReleased ? (
                  <h4>{t('common:statuses.For Sale')}</h4>
                ) : (
                  <Counter
                    target={new Date(packTemplate.releasedAt as string)}
                  />
                )}
              </div>

              <div className={css.actionItem}>
                {packTemplate.price ? (
                  <h3 className={css.price}>
                    <Credits value={packTemplate.price} parentheses />
                  </h3>
                ) : null}
              </div>
            </div>
            <div className={css.cta}>
              <ReleaseCTA />
            </div>
          </div>
        </div>

        {packTemplate.nftsPerPack && (
          <div className={css.container}>
            <div>
              <div className={css.contentsHeader}>
                <div className={css.contentsDescription}>
                  {`${t('release:packContains')} ${t('release:packContents', {
                    nftsPerPack: packTemplate.nftsPerPack,
                    nftCategory: packTemplate.nftCategory || 'NFTs',
                  })}`}
                  :
                </div>
              </div>

              <div className={css.items}>
                {imageUrls.map((url, index) => (
                  <div key={`release-item-${index}`} className={css.item}>
                    <Image
                      alt="Card Back"
                      layout="fill"
                      objectFit="cover"
                      src={url}
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Bidding activity */}
        {packTemplate.status === PackStatus.Active &&
          packTemplate.type === PackType.Auction &&
          packTemplate.auctionUntil &&
          packTemplate.releasedAt && (
            <BidActivity
              auctionUntil={packTemplate.auctionUntil}
              releasedAt={packTemplate.releasedAt}
              bids={packAuction?.bids || []}
              reservePrice={packTemplate.price}
              winningBidUserName={packAuction?.activeBid?.username || null}
            />
          )}

        {/* Modal */}
        <ClaimNFTModal
          onClose={handleClaimNFTFlow}
          open={isModalOpen}
          onSubmit={handleClaimNFT}
          packTemplate={packTemplate}
        />
      </div>
    </div>
  )
}
