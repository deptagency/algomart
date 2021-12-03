import {
  PackAuction,
  PackStatus,
  PackType,
  PublishedPack,
} from '@algomart/schemas'
import { GetServerSideProps } from 'next'
import useTranslation from 'next-translate/useTranslation'
import { useEffect } from 'react'

import { ApiClient } from '@/clients/api-client'
import { Analytics } from '@/clients/firebase-analytics'
import DefaultLayout from '@/layouts/default-layout'
import {
  getAuthenticatedUser,
  handleUnauthenticatedRedirect,
} from '@/services/api/auth-service'
import CheckoutTemplate from '@/templates/checkout-template'
import { urls } from '@/utils/urls'

export interface CheckoutPageProps {
  auctionPackId: string | null
  currentBid: number | null
  release: PublishedPack
}

export default function Checkout({
  auctionPackId,
  currentBid,
  release,
}: CheckoutPageProps) {
  const { t } = useTranslation()

  useEffect(() => {
    Analytics.instance.beginCheckout({
      itemName: release.title,
      value: currentBid ?? release.price,
    })
  }, [currentBid, release])

  return (
    <DefaultLayout
      pageTitle={
        release.type === PackType.Auction
          ? t('common:pageTitles.Placing Bid', { name: release.title })
          : t('common:pageTitles.Checking Out', { name: release.title })
      }
      panelPadding
    >
      <CheckoutTemplate
        auctionPackId={auctionPackId}
        currentBid={currentBid}
        release={release}
      />
    </DefaultLayout>
  )
}

export const getServerSideProps: GetServerSideProps<CheckoutPageProps> = async (
  context
) => {
  // Verify authentication
  const user = await getAuthenticatedUser(context)
  if (!user) {
    return handleUnauthenticatedRedirect(context.resolvedUrl)
  }

  // Get release based on search query
  const { pack: packSlug } = context.query
  if (typeof packSlug === 'string') {
    const { packs } = await ApiClient.instance.getPublishedPacks({
      locale: context.locale,
      slug: packSlug,
    })
    if (packs.length > 0) {
      const packTemplate = packs[0]
      // If there are no remaining packs, prohibit purchase
      if (!packTemplate.available) {
        return {
          redirect: {
            destination: urls.release.replace(':packSlug', packSlug),
            permanent: false,
          },
        }
      }

      let pack: PackAuction | null = null
      if (packTemplate.type === PackType.Auction) {
        // If the auction has ended, only the winning bidder can purchase
        pack = await ApiClient.instance.getAuctionPack(packTemplate.templateId)
        const auctionEnded = packTemplate.status === PackStatus.Expired
        const isWinningBidder = pack.activeBid?.externalId === user.externalId
        if (
          (auctionEnded && !isWinningBidder) ||
          pack.ownerExternalId === user.externalId
        ) {
          return {
            redirect: {
              destination: urls.release.replace(':packSlug', packSlug),
              permanent: false,
            },
          }
        }
      } else if (packTemplate.onePackPerCustomer) {
        // If a non-auction pack has already been purchased once and only
        // allows one per customer, redirect to release page
        const { total } = await ApiClient.instance.getPacksByOwnerId(
          user.externalId,
          { templateIds: [packTemplate.templateId] }
        )
        if (total > 0) {
          return {
            redirect: {
              destination: urls.release.replace(':packSlug', packSlug),
              permanent: false,
            },
          }
        }
      }
      return {
        props: {
          release: packTemplate,
          currentBid:
            typeof pack?.activeBid?.amount === 'number'
              ? pack?.activeBid?.amount
              : null,
          auctionPackId: pack?.packId || null,
        },
      }
    }
  }

  return {
    redirect: {
      destination: urls.home,
      permanent: false,
    },
  }
}
