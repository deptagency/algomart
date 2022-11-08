import { UserAccountStatus, UserStatusReport } from '@algomart/schemas'
import { GetServerSideProps } from 'next'
import useTranslation from 'next-translate/useTranslation'

import { ApiClient } from '@/clients/api-client'
import CashOutForm from '@/components/cash-out/cash-out-form'
import { AppConfig } from '@/config'
import { CashOutProvider } from '@/contexts/cash-out-context'
import DefaultLayout from '@/layouts/default-layout'
import {
  getAuthenticatedUser,
  getTokenFromCookie,
  handleUnauthenticatedRedirect,
} from '@/services/api/auth-service'
import { apiFetcher } from '@/utils/react-query'
import { urls } from '@/utils/urls'

interface CashOutProps {
  availableBalance: number
  isVerificationEnabled: boolean
  userHasCompletedKyc: boolean
}

export default function CashOut({
  availableBalance,
  isVerificationEnabled,
  userHasCompletedKyc,
}: CashOutProps) {
  const { t } = useTranslation()

  return (
    <DefaultLayout pageTitle={t('common:pageTitles.Cash Out')}>
      <CashOutProvider
        availableBalance={availableBalance}
        isVerificationEnabled={isVerificationEnabled}
        userHasCompletedKyc={userHasCompletedKyc}
      >
        <CashOutForm />
      </CashOutProvider>
    </DefaultLayout>
  )
}

export const getServerSideProps: GetServerSideProps<{
  availableBalance: number
}> = async (context) => {
  const user = await getAuthenticatedUser(context)
  if (!user) {
    return handleUnauthenticatedRedirect(context.resolvedUrl)
  }

  const bearerToken = getTokenFromCookie(context.req, context.res)
  const client = new ApiClient(AppConfig.apiURL, bearerToken)

  const userStatus = await apiFetcher().get<UserStatusReport>(
    urls.api.accounts.status,
    { bearerToken }
  )

  if (!userStatus) {
    return {
      notFound: true,
    }
  }

  const result = await client.getBalanceAvailableForPayout()
  const isClear =
    userStatus.status === UserAccountStatus.Clear ||
    userStatus.status === UserAccountStatus.Approved

  return {
    props: {
      availableBalance: result.availableBalance,
      isVerificationEnabled: userStatus.isVerificationEnabled,
      userHasCompletedKyc: isClear,
    },
  }
}
