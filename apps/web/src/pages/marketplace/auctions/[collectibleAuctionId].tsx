import { PackAuction, PackType, PublishedPack } from '@algomart/schemas'
import { GetServerSideProps } from 'next'
import useTranslation from 'next-translate/useTranslation'
import { useEffect } from 'react'

import { ApiClient } from '@/clients/api-client'
import { Analytics } from '@/clients/firebase-analytics'
import { useRedemption } from '@/contexts/redemption-context'
import DefaultLayout from '@/layouts/default-layout'
import {
  getAuthenticatedUser,
  getProfileImageForUser,
} from '@/services/api/auth-service'
import ReleaseTemplate from '@/templates/release-template'
import { isAfterNow } from '@/utils/date-time'

interface ReleasePageProps {
  avatars: { [key: string]: string | null }
  disallowBuyOrClaim: boolean | null
  isHighestBidder: boolean | null
  isOutbid: boolean | null
  isOwner: boolean | null
  isWinningBidder: boolean | null
  packAuction: PackAuction | null
  packTemplate: PublishedPack
}

export default function ReleasePage({
  avatars,
  disallowBuyOrClaim,
  isHighestBidder,
  isOutbid,
  isOwner,
  isWinningBidder,
  packAuction,
  packTemplate,
}: ReleasePageProps) {
  const { setRedeemable } = useRedemption()
  const { t } = useTranslation()

  useEffect(() => {
    Analytics.instance.viewItem({
      itemName: packTemplate.title,
      value: packAuction?.activeBid?.amount ?? packTemplate.price,
    })
  }, [packAuction, packTemplate])

  const handleClaimNFT = async (): Promise<{ packId: string } | string> => {
    // TODO: implement for marketplace auction
    return { packId: packAuction.packId }
  }

  return (
    <DefaultLayout
      pageTitle={t('common:pageTitles.Release', { name: packTemplate.title })}
      noPanel
    >
      <ReleaseTemplate
        avatars={avatars}
        disallowBuyOrClaim={disallowBuyOrClaim}
        handleClaimNFT={handleClaimNFT}
        isHighestBidder={isHighestBidder}
        isOutbid={isOutbid}
        isOwner={isOwner}
        isWinningBidder={isWinningBidder}
        packAuction={packAuction}
        packTemplate={packTemplate}
      />
    </DefaultLayout>
  )
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  const user = await getAuthenticatedUser(context)

  const collectibleAuctionId = context?.params?.collectibleAuctionId as string
  const collectibleAuction = await ApiClient.instance.getCollectibleAuction(
    collectibleAuctionId
  )

  if (!collectibleAuction) {
    return {
      notFound: true,
    }
  }

  const avatars: { [key: string]: string | null } = {}
  let isHighestBidder = null,
    isOwner = null,
    isWinningBidder = null,
    isOutbid = null

  const collectible = await ApiClient.instance.getCollectiblesById(
    collectibleAuction.collectibleId
  )

  const collectibleAuctionBids =
    await ApiClient.instance.getCollectibleAuctionBids(collectibleAuctionId)
  const activeBid = collectibleAuctionBids[0]
  const collectibleTemplate = await ApiClient.instance.getCollectibleTemplate(
    collectible.templateId
  )

  // Get bidder avatars
  await Promise.all(
    collectibleAuctionBids.map(async ({ externalId }) => {
      avatars[externalId] = await getProfileImageForUser(externalId)
    })
  )

  // Configure auction statuses
  if (user) {
    const isClosed = !!(
      collectibleAuction.endAt &&
      !isAfterNow(new Date(collectibleAuction.endAt))
    )
    const userHasBids = collectibleAuctionBids?.some(
      (b) => b.externalId === user.externalId
    )

    isHighestBidder = activeBid?.externalId === user.externalId
    isOwner = collectible.ownerExternalId === user.externalId
    isWinningBidder = isHighestBidder && isClosed
    isOutbid = !isHighestBidder && userHasBids
  }

  return {
    props: {
      avatars,
      isHighestBidder,
      isOutbid,
      isOwner,
      isWinningBidder,
      packAuction: {
        ...collectibleAuction,
        bids: collectibleAuctionBids,
        ownerExternalId: collectible.ownerExternalId,
      },
      packTemplate: {
        type: 'auction',
        auctionUntil: collectibleAuction.endAt,
        releasedAt: collectibleAuction.startAt,
        price: collectibleAuction.reservePrice,
        status: collectibleAuction.status,
        templateId: collectibleTemplate.id,
        ...collectibleTemplate,
      },
    },
  }
}
