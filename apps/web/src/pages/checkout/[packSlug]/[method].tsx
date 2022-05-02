import {
  CheckoutMethod,
  PackAuction,
  PackStatus,
  PackType,
  PublishedPack,
} from '@algomart/schemas'
import { GetServerSideProps } from 'next'
import useTranslation from 'next-translate/useTranslation'
import { useEffect } from 'react'

import { ApiClient } from '@/clients/api-client'
import { PaymentProvider } from '@/contexts/payment-context'
import { Environment } from '@/environment'
import { useAnalytics } from '@/hooks/use-analytics'
import DefaultLayout from '@/layouts/default-layout'
import {
  getAuthenticatedUser,
  handleUnauthenticatedRedirect,
} from '@/services/api/auth-service'
import CheckoutMethodsTemplate from '@/templates/checkout-methods-template'
import { urlFor, urls } from '@/utils/urls'

export interface CheckoutMethodPageProps {
  address: string | null
  auctionPackId: string | null
  currentBid: number | null
  release: PublishedPack
}

export default function CheckoutMethodPage({
  address,
  auctionPackId,
  currentBid,
  release,
}: CheckoutMethodPageProps) {
  const { t } = useTranslation()
  const analytics = useAnalytics()

  useEffect(() => {
    analytics.beginCheckout({
      itemName: release.title,
      value: currentBid ?? release.price,
    })
  }, [analytics, currentBid, release])

  return (
    <DefaultLayout
      pageTitle={
        release.type === PackType.Auction
          ? t('common:pageTitles.Placing Bid', { name: release.title })
          : t('common:pageTitles.Checking Out', { name: release.title })
      }
      panelPadding
    >
      <PaymentProvider {...{ auctionPackId, currentBid, release }}>
        <CheckoutMethodsTemplate address={address} />
      </PaymentProvider>
    </DefaultLayout>
  )
}

export const getServerSideProps: GetServerSideProps<
  CheckoutMethodPageProps
> = async (context) => {
  const params = context.params
  const packSlug = context?.params?.packSlug as string

  // Verify authentication
  const user = await getAuthenticatedUser(context)
  if (!user) {
    return handleUnauthenticatedRedirect(context.resolvedUrl)
  }

  // Redirect to checkout page to select method if the method isn't recognized
  if (
    params?.method &&
    !Object.values(CheckoutMethod).includes(params.method as CheckoutMethod)
  ) {
    return {
      redirect: {
        destination: urlFor(urls.checkoutPack, { packSlug }),
        permanent: false,
      },
    }
  }

  // Redirect to card payment flow if feature flags aren't present
  if (
    !Environment.isWireEnabled &&
    !Environment.isCryptoEnabled &&
    params?.method !== CheckoutMethod.card
  ) {
    return {
      redirect: {
        destination: urlFor(urls.checkoutPackWithMethod, {
          packSlug,
          method: 'card',
        }),
        permanent: false,
      },
    }
  }

  // Find pack templates
  const packTemplate = await ApiClient.instance.getPublishedPackBySlug(
    params?.packSlug as string,
    context.locale
  )

  // If no pack templates were found, return 404
  if (!packTemplate) {
    return {
      notFound: true,
    }
  }

  // If there are no remaining packs, prohibit purchase
  if (!packTemplate.available) {
    return {
      redirect: {
        destination: urlFor(urls.products, { packSlug }),
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
          destination: urlFor(urls.products, { packSlug }),
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
          destination: urlFor(urls.products, { packSlug }),
          permanent: false,
        },
      }
    }
  }

  let address
  if (params?.method && params.method === CheckoutMethod.crypto) {
    // Get release based on search query
    address = await ApiClient.instance.createWalletAddress().catch(() => null)
  }
  return {
    props: {
      address: address?.address || null,
      release: packTemplate,
      currentBid:
        typeof pack?.activeBid?.amount === 'number'
          ? pack?.activeBid?.amount
          : null,
      auctionPackId: pack?.packId || null,
    },
  }
}
