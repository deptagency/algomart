import {
  CollectibleWithDetails,
  isPurchaseAllowed,
  PaymentItem,
  UserStatusReport,
} from '@algomart/schemas'
import { GetServerSideProps } from 'next'
import { useRouter } from 'next/router'
import useTranslation from 'next-translate/useTranslation'

import { ApiClient } from '@/clients/api-client'
import KYCNotice from '@/components/kyc/notice'
import MainPanel from '@/components/main-panel/main-panel'
import ProductSaleHeader from '@/components/product-sale-header'
import { AppConfig } from '@/config'
import { useAuth } from '@/contexts/auth-context'
import { ProductCreditsPaymentProvider } from '@/contexts/product-credits-payment-context'
import { ProductUnifiedPaymentProvider } from '@/contexts/product-unified-payment-context'
import { usePurchaseListingWithCredits } from '@/hooks/api/use-purchase-listing-with-credits'
import DefaultLayout from '@/layouts/default-layout'
import {
  getAuthenticatedUser,
  getTokenFromCookie,
  handleUnauthenticatedRedirect,
} from '@/services/api/auth-service'
import CheckoutTemplate from '@/templates/checkout-template'
import { PurchaseCollectibleCreditsTemplate } from '@/templates/purchase-collectible-credits-template'
import { PurchaseCollectibleUnifiedTemplate } from '@/templates/purchase-collectible-unified-template'
import getPurchasableStatus, {
  PurchasableStatus,
} from '@/utils/get-purchasable-status'
import { apiFetcher } from '@/utils/react-query'
import { hashEvents, urls } from '@/utils/urls'

export interface CollectibleCheckoutPageProps {
  collectible: CollectibleWithDetails
  isPaymentAllowed: boolean
  isPurchasable: boolean
  purchasableStatus: PurchasableStatus
  userStatus: UserStatusReport
}

export default function CollectibleCheckoutPage({
  collectible,
  isPaymentAllowed,
  isPurchasable,
  purchasableStatus,
  userStatus,
}: CollectibleCheckoutPageProps) {
  const { t } = useTranslation()
  const { user } = useAuth()
  const { asPath } = useRouter()

  const hasSufficientBalance = user?.balance >= collectible?.price
  const isFinishingCreditsFlow = `#${asPath.split('#')[1]}`.includes(
    hashEvents.creditsPaymentSuccess
  )

  const { mutate: purchaseListingWithCredits } = usePurchaseListingWithCredits()

  return (
    <DefaultLayout
      fullBleed
      pageTitle={t('common:pageTitles.Checking Out', {
        name: collectible.title,
      })}
      variant="colorful"
    >
      <ProductSaleHeader
        title={collectible.title}
        imageUrl={collectible.image}
        price={collectible.price}
      />
      {isPaymentAllowed ? (
        <MainPanel>
          <CheckoutTemplate>
            {/* Pay with credits if sufficient balance, otherwise use unified flow  */}
            <ProductCreditsPaymentProvider
              onPurchase={purchaseListingWithCredits}
              product={{
                id: collectible.listingId,
                price: collectible.price,
              }}
            >
              {(hasSufficientBalance || isFinishingCreditsFlow) && (
                <PurchaseCollectibleCreditsTemplate />
              )}
            </ProductCreditsPaymentProvider>
            <ProductUnifiedPaymentProvider
              product={{
                id: collectible.listingId,
                price: collectible.price,
                title: collectible.title,
                type: PaymentItem.Collectible,
              }}
              userStatus={userStatus}
            >
              {!hasSufficientBalance && !isFinishingCreditsFlow && (
                <PurchaseCollectibleUnifiedTemplate
                  assetId={collectible.address}
                  isPurchasable={isPurchasable}
                  purchasableStatus={purchasableStatus}
                />
              )}
            </ProductUnifiedPaymentProvider>
          </CheckoutTemplate>
        </MainPanel>
      ) : (
        <KYCNotice />
      )}
    </DefaultLayout>
  )
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  // Verify authentication
  const user = await getAuthenticatedUser(context)
  if (!user) {
    return handleUnauthenticatedRedirect(context.resolvedUrl)
  }

  const assetId = context?.params?.assetId as string
  const client = new ApiClient(
    AppConfig.apiURL,
    getTokenFromCookie(context.req, context.res)
  )

  const collectible = await client.getCollectible({
    assetId: Number(assetId),
    language: context.locale,
  })

  if (!collectible) {
    return {
      notFound: true,
    }
  }

  const bearerToken = getTokenFromCookie(context.req, context.res)
  const userStatus = await apiFetcher().get<UserStatusReport>(
    urls.api.accounts.status,
    { bearerToken }
  )

  if (!userStatus || !userStatus.status) {
    return {
      notFound: true,
    }
  }

  const isPaymentAllowed = isPurchaseAllowed(userStatus)

  // TODO: Prohibit purchase if not transferrable yet
  const purchasableStatus = getPurchasableStatus(collectible, user.address)
  const isPurchasable = purchasableStatus === PurchasableStatus.CanPurchase

  return {
    props: {
      collectible,
      isPaymentAllowed,
      isPurchasable,
      purchasableStatus,
      userStatus,
    },
  }
}
