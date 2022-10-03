import {
  ApplicantToken,
  ToApplicantBaseExtended,
  UserStatusReport,
  WorkflowDetails,
} from '@algomart/schemas'
import { GetServerSideProps } from 'next'
import useTranslation from 'next-translate/useTranslation'

import { KYCProvider } from '@/contexts/kyc-context'
import MyProfileLayout from '@/layouts/my-profile-layout'
import {
  getAuthenticatedUser,
  getTokenFromCookie,
  handleUnauthenticatedRedirect,
} from '@/services/api/auth-service'
import MyVerificationTemplate from '@/templates/my-verification-template'
import { apiFetcher } from '@/utils/react-query'
import { urls } from '@/utils/urls'

export interface MyVerificationPageProps {
  applicant: ToApplicantBaseExtended | null
  applicantId: string | null
  isKYCEnabled: boolean
  token: string | null
  userStatus: UserStatusReport
  workflow: WorkflowDetails | null
}

export default function MyVerificationPage({
  applicant,
  applicantId,
  isKYCEnabled,
  token,
  userStatus,
  workflow,
}: MyVerificationPageProps) {
  const { t } = useTranslation()
  return (
    <MyProfileLayout pageTitle={t('common:pageTitles.My Verification')}>
      {isKYCEnabled ? (
        <KYCProvider
          applicantId={applicantId}
          applicant={applicant}
          userStatus={userStatus}
          token={token}
          workflow={workflow}
        >
          <MyVerificationTemplate />
        </KYCProvider>
      ) : (
        <p>{t('common:statuses.Verification Not Enabled')}</p>
      )}
    </MyProfileLayout>
  )
}

export const getServerSideProps: GetServerSideProps<
  MyVerificationPageProps
> = async (context) => {
  // Verify authentication
  const user = await getAuthenticatedUser(context)
  if (!user) {
    return handleUnauthenticatedRedirect(context.resolvedUrl)
  }

  // Check user verification status
  const bearerToken = getTokenFromCookie(context.req, context.res)
  const userStatus = await apiFetcher().get<UserStatusReport>(
    urls.api.accounts.status,
    { bearerToken }
  )

  if (!userStatus || !userStatus.isVerificationEnabled) {
    return {
      notFound: true,
    }
  }

  // If there's an applicant associated, get details, an SDK token, and the workflow run ID
  let applicant: ToApplicantBaseExtended | null = null
  let token: string | null = null
  let workflow: WorkflowDetails | null = null
  if (user.applicantId) {
    applicant = await apiFetcher().get<ToApplicantBaseExtended>(
      urls.api.accounts.applicant,
      {
        bearerToken,
      }
    )
    if (applicant?.workflow) workflow = applicant.workflow
    const tokenResponse = await apiFetcher().get<ApplicantToken>(
      urls.api.accounts.applicantToken,
      {
        bearerToken,
      }
    )
    token = tokenResponse.token
  }

  return {
    props: {
      applicantId: user.applicantId || null,
      applicant,
      userStatus,
      token,
      workflow,
      isKYCEnabled: userStatus.isVerificationEnabled,
    },
  }
}
