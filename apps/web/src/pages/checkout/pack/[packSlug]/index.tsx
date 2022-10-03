import {
  isPurchaseAllowed,
  PacksByOwner,
  PaymentItem,
  PaymentOption,
  PublishedPack,
  UserStatusReport,
} from '@algomart/schemas'
import { isAfterNow } from '@algomart/shared/utils'
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
import { usePurchasePackWithCredits } from '@/hooks/api/use-purchase-pack-with-credits'
import DefaultLayout from '@/layouts/default-layout'
import {
  getAuthenticatedUser,
  getTokenFromCookie,
  handleUnauthenticatedRedirect,
} from '@/services/api/auth-service'
import CheckoutTemplate from '@/templates/checkout-template'
import { PurchasePackCreditsTemplate } from '@/templates/purchase-pack-credits-template'
import PurchasePackUnifiedTemplate from '@/templates/purchase-pack-unified-template'
import { apiFetcher } from '@/utils/react-query'
import { hashEvents, urlFor, urls } from '@/utils/urls'

export interface PackCheckoutPageProps {
  isPaymentAllowed: boolean
  packTemplate: PublishedPack
  userStatus: UserStatusReport
}

export default function PackCheckoutPage({
  isPaymentAllowed,
  packTemplate,
  userStatus,
}: PackCheckoutPageProps) {
  const { t } = useTranslation()
  const { user } = useAuth()
  const { asPath } = useRouter()

  const hasSufficientBalance = user?.balance >= packTemplate?.price
  const isFinishingCreditsFlow = `#${asPath.split('#')[1]}`.includes(
    hashEvents.creditsPaymentSuccess
  )

  const { mutate: purchasePackWithCredits } = usePurchasePackWithCredits()

  return (
    <DefaultLayout
      fullBleed
      pageTitle={t('common:pageTitles.Checking Out', {
        name: packTemplate.title,
      })}
      variant="colorful"
    >
      <ProductSaleHeader
        title={packTemplate.title}
        imageUrl={packTemplate.image}
        price={packTemplate.price}
      />
      {isPaymentAllowed ? (
        <MainPanel>
          <CheckoutTemplate>
            {/* Pay with credits if sufficient balance, otherwise use unified flow  */}
            <ProductCreditsPaymentProvider
              onPurchase={purchasePackWithCredits}
              product={{
                id: packTemplate.templateId,
                price: packTemplate.price,
              }}
            >
              {(hasSufficientBalance || isFinishingCreditsFlow) && (
                <PurchasePackCreditsTemplate />
              )}
            </ProductCreditsPaymentProvider>
            <ProductUnifiedPaymentProvider
              product={{
                id: packTemplate.templateId,
                price: packTemplate.price,
                title: packTemplate.title,
                type: PaymentItem.Pack,
              }}
              userStatus={userStatus}
            >
              {!hasSufficientBalance && !isFinishingCreditsFlow && (
                <PurchasePackUnifiedTemplate />
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

export const getServerSideProps: GetServerSideProps<
  PackCheckoutPageProps
> = async (context) => {
  // Verify authentication
  const user = await getAuthenticatedUser(context)
  if (!user) {
    return handleUnauthenticatedRedirect(context.resolvedUrl)
  }

  const packSlug = context?.params?.packSlug as string
  const bearerToken = getTokenFromCookie(context.req, context.res)
  const client = new ApiClient(AppConfig.apiURL, bearerToken)

  const packTemplate = await client.getPublishedPackBySlug(
    packSlug,
    context.locale
  )

  // If no pack templates were found, or they're not yet released, return 404
  if (!packTemplate || isAfterNow(new Date(packTemplate.releasedAt))) {
    return {
      notFound: true,
    }
  }

  const userStatus = await apiFetcher().get<UserStatusReport>(
    urls.api.accounts.status,
    { bearerToken }
  )

  if (!userStatus || !userStatus.status) {
    return {
      notFound: true,
    }
  }

  // If there are no remaining packs, prohibit purchase
  if (!packTemplate.available) {
    return {
      redirect: {
        destination: urlFor(urls.releasePack, { packSlug }),
        permanent: false,
      },
    }
  }

  if (packTemplate.onePackPerCustomer) {
    // If a non-auction pack has already been purchased once and only
    // allows one per customer, redirect to release page
    const { total } = await apiFetcher().get<PacksByOwner>(
      urlFor(urls.api.packs.byOwner, undefined, {
        templateIds: [packTemplate.templateId],
      }),
      {
        bearerToken,
      }
    )
    if (total > 0) {
      return {
        redirect: {
          destination: urlFor(urls.releasePack, { packSlug }),
          permanent: false,
        },
      }
    }
  }

  // Method is card so that "Limited" status accounts are accepted initially
  const isPaymentAllowed = isPurchaseAllowed(
    userStatus,
    null,
    PaymentOption.Card
  )

  return {
    props: {
      isPaymentAllowed,
      packTemplate: packTemplate,
      userStatus,
    },
  }
}
