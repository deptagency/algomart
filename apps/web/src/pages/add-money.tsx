import { UserStatusReport } from '@algomart/schemas'
import { GetServerSideProps } from 'next'
import useTranslation from 'next-translate/useTranslation'

import { PurchaseCreditsProvider } from '@/contexts/purchase-credits-context'
import DefaultLayout from '@/layouts/default-layout'
import {
  getAuthenticatedUser,
  getTokenFromCookie,
  handleUnauthenticatedRedirect,
} from '@/services/api/auth-service'
import PurchaseCreditsTemplate from '@/templates/purchase-credits-template'
import { apiFetcher } from '@/utils/react-query'
import { urls } from '@/utils/urls'

export interface PurchaseCreditsProps {
  userStatus: UserStatusReport
}

export default function PurchaseCredits({ userStatus }: PurchaseCreditsProps) {
  const { t } = useTranslation()

  return (
    <DefaultLayout pageTitle={t('common:pageTitles.Add Money')}>
      <PurchaseCreditsProvider userStatus={userStatus}>
        <PurchaseCreditsTemplate />
      </PurchaseCreditsProvider>
    </DefaultLayout>
  )
}

export const getServerSideProps: GetServerSideProps<
  PurchaseCreditsProps
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
