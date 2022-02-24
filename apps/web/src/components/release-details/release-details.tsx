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
import ReleasePackContents from './sections/release-packContents'

import css from './release-details.module.css'

import { urls } from '@/utils/urls'

export interface ReleaseDetailsProps {
  disallowBuyOrClaim: boolean | null
  isOwner: boolean | null
  isWinningBidder: boolean | null
  onCheckout(): void
  packAuction: PackAuction | null
  packTemplate: PublishedPack
}

export default function ReleaseDetails({
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
      {/* Title & Subtitle */}
      <div className={css.header}>
        <h1 className={css.title}>{packTemplate.title}</h1>
        {packTemplate.subtitle ? (
          <h2 className={css.subtitle}>{packTemplate.subtitle}</h2>
        ) : null}
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

      {/* Number of NFTs in this pack */}
      {packTemplate.nftsPerPack && (
        <ReleasePackContents
          nftsPerPack={packTemplate.nftsPerPack}
          nftCategory={packTemplate.nftCategory}
        />
      )}

      {/* Description content */}
      {packTemplate.body && (
        <ReleaseDescription description={packTemplate.body} />
      )}
    </section>
  )
}
