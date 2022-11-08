import { PackAuction, PackType, PublishedPack } from '@algomart/schemas'
import { GetStaticProps, GetStaticPropsContext } from 'next'
import useTranslation from 'next-translate/useTranslation'
import { useMemo } from 'react'

import { ApiClient } from '@/clients/api-client'
import { AppConfig } from '@/config'
import { useAuth } from '@/contexts/auth-context'
import { useLanguage } from '@/contexts/language-context'
import { useRedemption } from '@/contexts/redemption-context'
import DefaultLayout from '@/layouts/default-layout'
import { CollectibleService } from '@/services/collectible-service'
import BrowsePackTemplate from '@/templates/browse-pack-template'
import { isAfterNow } from '@/utils/date-time'
import { useAPI } from '@/utils/react-query'
import { urlFor, urls } from '@/utils/urls'

interface BrowsePackPageProps {
  packTemplate: PublishedPack
}

interface AuctionData {
  isHighestBidder: boolean
  isOutbid: boolean
  isOwner: boolean
  isWinningBidder: boolean
  disallowBuyOrClaim: boolean
  packAuction: PackAuction | null
}

export default function BrowsePackPage({
  packTemplate: initialPackTemplate,
}: BrowsePackPageProps) {
  const { setRedeemable } = useRedemption()
  const { t } = useTranslation()
  const { user } = useAuth()
  const { language } = useLanguage()

  const { data: packTemplate } = useAPI<PublishedPack>(
    ['pack_template', initialPackTemplate.slug],
    urlFor(
      urls.api.packs.bySlug,
      { slug: initialPackTemplate.slug },
      { language }
    ),
    {
      initialData: initialPackTemplate,
    }
  )

  const { data: packAuction } = useAPI<PackAuction>(
    ['pack_auction', packTemplate.templateId],
    urlFor(urls.api.packs.auctionByTemplateId, {
      templateId: packTemplate.templateId,
    }),
    {
      enabled: packTemplate.type === PackType.Auction,
    }
  )

  const { data: { total = 0 } = {} } = useAPI<{ total: number }>(
    ['packs_owned', packTemplate.templateId],
    urlFor(urls.api.packs.byOwner, undefined, {
      templateId: packTemplate.templateId,
    }),
    {
      enabled: !!(
        user &&
        packTemplate.type !== PackType.Auction &&
        packTemplate.onePackPerCustomer
      ),
    }
  )

  const auctionData = useMemo<AuctionData>(() => {
    const isClosed = !!(
      packTemplate.auctionUntil &&
      !isAfterNow(new Date(packTemplate.auctionUntil))
    )
    const hasBids = packAuction?.bids?.some(
      (b) => b.userExternalId === user?.uid
    )
    const isHighestBidder =
      packAuction &&
      packAuction.activeBid &&
      user &&
      packAuction.activeBid.userExternalId === user.uid

    return {
      isHighestBidder,
      isOutbid: !isHighestBidder && hasBids,
      isOwner: packAuction && user && packAuction.userExternalId === user.uid,
      isWinningBidder: isHighestBidder && isClosed,
      disallowBuyOrClaim: total > 0,
      packAuction,
    }
  }, [packTemplate.auctionUntil, packAuction, user, total])

  const handleClaimNFT = async (
    redeemCode: string
  ): Promise<{ packId: string } | string> => {
    // Redeem/claim asset
    const { packId } =
      packTemplate.type === PackType.Redeem
        ? await CollectibleService.instance.redeem(redeemCode)
        : await CollectibleService.instance.claim(packTemplate.templateId)

    // Don't mint if redemption fails
    if (!packId) {
      return t('forms:errors.invalidRedemptionCode')
    }

    // Clear redemption data
    if (packTemplate.type === PackType.Redeem) {
      setRedeemable(null)
    }

    return { packId }
  }

  return (
    <DefaultLayout
      fullBleed
      pageTitle={t('common:pageTitles.Release', {
        name: packTemplate.title,
      })}
      variant="colorful"
    >
      <BrowsePackTemplate
        disallowBuyOrClaim={auctionData.disallowBuyOrClaim}
        handleClaimNFT={handleClaimNFT}
        isOwner={auctionData.isOwner}
        isWinningBidder={auctionData.isWinningBidder}
        packAuction={auctionData.packAuction}
        packTemplate={packTemplate}
      />
    </DefaultLayout>
  )
}

export async function getStaticPaths() {
  return {
    paths: [],
    fallback: 'blocking',
  }
}

export const getStaticProps: GetStaticProps = async (
  context: GetStaticPropsContext
) => {
  const client = new ApiClient(AppConfig.apiURL)
  const packTemplate = await client.getPublishedPackBySlug(
    context.params.packSlug as string,
    context.locale
  )
  if (!packTemplate) {
    return { notFound: true, revalidate: 1 }
  }

  return {
    revalidate: 10,
    props: { packTemplate },
  }
}
