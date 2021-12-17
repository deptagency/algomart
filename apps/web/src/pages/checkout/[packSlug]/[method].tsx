import {
  CheckoutMethod,
  CheckoutStatus,
  PackAuction,
  PackStatus,
  PackType,
  PublishedPack,
} from '@algomart/schemas'
import { GetServerSideProps } from 'next'
import { useRouter } from 'next/router'
import useTranslation from 'next-translate/useTranslation'
import { useEffect } from 'react'
import { v4 as uuid } from 'uuid'

import { ApiClient } from '@/clients/api-client'
import { Analytics } from '@/clients/firebase-analytics'
import { usePaymentProvider } from '@/contexts/payment-context'
import { Environment } from '@/environment'
import DefaultLayout from '@/layouts/default-layout'
import {
  getAuthenticatedUser,
  handleUnauthenticatedRedirect,
} from '@/services/api/auth-service'
import CheckoutTemplate from '@/templates/checkout-method-template'
import { urls } from '@/utils/urls'

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
  const { query } = useRouter()
  const paymentProps = usePaymentProvider({
    auctionPackId,
    currentBid,
    release,
  })
  const { setStatus, setAddress } = paymentProps

  // Set the address retrieved in server side props
  useEffect(() => {
    if (address) {
      setAddress(address)
    }
  }, [address, setAddress])

  // Set the status to the status listed as a query param:
  useEffect(() => {
    if (query.step) {
      const status =
        query?.step === 'details' ? CheckoutStatus.form : CheckoutStatus.summary
      setStatus(status)
    }
  }, [query.step, setStatus])

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
      <CheckoutTemplate {...paymentProps} />
    </DefaultLayout>
  )
}

export const getServerSideProps: GetServerSideProps<
  CheckoutMethodPageProps
> = async (context) => {
  // Verify authentication
  const user = await getAuthenticatedUser(context)
  if (!user) {
    return handleUnauthenticatedRedirect(context.resolvedUrl)
  }

  if (!Environment.isWireEnabled && !Environment.isCryptoEnabled) {
    return {
      redirect: {
        destination: urls.checkoutPackWithMethod
          .replace(':packSlug', context?.params?.packSlug as string)
          .replace(':method', 'card'),
        permanent: false,
      },
    }
  }

  const params = context.params
  const { packs: packTemplates } = await ApiClient.instance.getPublishedPacks({
    locale: context.locale,
    slug: params?.packSlug as string,
  })

  // If no pack templates were found, return 404
  if (!packTemplates || packTemplates.length === 0) {
    return {
      notFound: true,
    }
  }

  // If there are no remaining packs, prohibit purchase
  const packTemplate = packTemplates[0]
  if (!packTemplate.available) {
    return {
      redirect: {
        destination: urls.release.replace(
          ':packSlug',
          context?.params?.packSlug as string
        ),
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
          destination: urls.release.replace(
            ':packSlug',
            context?.params?.packSlug as string
          ),
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
          destination: urls.release.replace(
            ':packSlug',
            context?.params?.packSlug as string
          ),
          permanent: false,
        },
      }
    }
  }

  let address
  if (params?.method && params.method === CheckoutMethod.crypto) {
    // Get release based on search query
    address = await ApiClient.instance
      .createWalletAddress({
        idempotencyKey: uuid(),
      })
      .catch(() => null)
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
