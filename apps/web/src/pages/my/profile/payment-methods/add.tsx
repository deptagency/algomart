import { UserStatusReport } from '@algomart/schemas'
import { GetServerSideProps } from 'next'
import useTranslation from 'next-translate/useTranslation'

import { PurchaseCreditsProvider } from '@/contexts/purchase-credits-context'
import MyProfileLayout from '@/layouts/my-profile-layout'
import {
  getAuthenticatedUser,
  getTokenFromCookie,
  handleUnauthenticatedRedirect,
} from '@/services/api/auth-service'
import MyProfilePaymentMethodsAddTemplate from '@/templates/my-profile-payment-methods-add-template'
import { apiFetcher } from '@/utils/react-query'
import { urls } from '@/utils/urls'

interface MyProfilePaymentMethodsAddPageProps {
  userStatus: UserStatusReport
}

export default function MyProfilePaymentMethodsAddPage({
  userStatus,
}: MyProfilePaymentMethodsAddPageProps) {
  const { t } = useTranslation()

  return (
    <MyProfileLayout pageTitle={t('common:pageTitles.Add Payment Method')}>
      <PurchaseCreditsProvider userStatus={userStatus}>
        <MyProfilePaymentMethodsAddTemplate />
      </PurchaseCreditsProvider>
    </MyProfileLayout>
  )
}

export const getServerSideProps: GetServerSideProps<
  MyProfilePaymentMethodsAddPageProps
> = async (context) => {
  // Verify authentication
  const user = await getAuthenticatedUser(context)
  if (!user) {
    return handleUnauthenticatedRedirect(context.resolvedUrl)
  }

  const bearerToken = getTokenFromCookie(context.req, context.res)
  const userStatus = await apiFetcher().get<UserStatusReport>(
    urls.api.accounts.status,
    { bearerToken }
  )

  if (!userStatus) {
    return {
      notFound: true,
    }
  }

  return {
    props: {
      userStatus,
    },
  }
}
