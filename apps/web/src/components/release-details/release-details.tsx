import {
  PackAuction,
  PackStatus,
  PackType,
  PublishedPack,
} from '@algomart/schemas'
import { useRouter } from 'next/router'

import ReleaseCTA from './sections/release-cta'
import ReleaseDescription from './sections/release-description'
import ReleaseMetadata from './sections/release-metadata'

import css from './release-details.module.css'

import BidActivity from '@/components/bid-activity/bid-activity'
import { urls } from '@/utils/urls'

export interface ReleaseDetailsProps {
  avatars: { [key: string]: string | null }
  disallowBuyOrClaim: boolean | null
  isOwner: boolean | null
  isWinningBidder: boolean | null
  onCheckout(): void
  packAuction: PackAuction | null
  packTemplate: PublishedPack
}

export default function ReleaseDetails({
  avatars,
  disallowBuyOrClaim,
  isOwner,
  isWinningBidder,
  onCheckout,
  packAuction,
  packTemplate,
}: ReleaseDetailsProps) {
  const { push } = useRouter()
  return (
    <section className={css.root}>
      {/* Title */}
      <div className={css.header}>
        <h1 className={css.title}>{packTemplate.title}</h1>
      </div>

      {/* Metadata */}
      <ReleaseMetadata packAuction={packAuction} packTemplate={packTemplate} />

      {/* Show CTA when active */}
      {(packTemplate.status === PackStatus.Active ||
        (packTemplate.type === PackType.Auction &&
          packTemplate.status === PackStatus.Expired &&
          isWinningBidder)) && (
        <ReleaseCTA
          disallowBuyOrClaim={disallowBuyOrClaim}
          isOwner={isOwner}
          isWinningBidder={isWinningBidder}
          onClick={isOwner ? () => push(urls.myCollectibles) : onCheckout}
          releaseIsAvailable={Boolean(packTemplate.available)}
          status={packTemplate.status}
          type={packTemplate.type}
        />
      )}

      {/* Description content */}
      {packTemplate.body && (
        <ReleaseDescription description={packTemplate.body} />
      )}

      {/* Bidding activity */}
      {packTemplate.status === PackStatus.Active &&
        packTemplate.type === PackType.Auction &&
        packTemplate.auctionUntil &&
        packTemplate.releasedAt && (
          <BidActivity
            avatars={avatars}
            auctionUntil={packTemplate.auctionUntil}
            releasedAt={packTemplate.releasedAt}
            bids={packAuction?.bids || []}
            reservePrice={packTemplate.price}
            winningBidUserName={packAuction?.activeBid?.username || null}
          />
        )}
    </section>
  )
}
