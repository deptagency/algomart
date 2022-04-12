import { loadStripe, Stripe } from '@stripe/stripe-js'
import { GetServerSideProps } from 'next'
import useTranslation from 'next-translate/useTranslation'

import { Environment } from '@/environment'
import DefaultLayout from '@/layouts/default-layout'
import {
  getAuthenticatedUser,
  handleUnauthenticatedRedirect,
} from '@/services/api/auth-service'
import VerificationTemplate from '@/templates/kyc-verification-template'
import { urls } from '@/utils/urls'

export interface VerifyPageProps {
  stripe: Stripe
}

export default function VerifyPage({ stripe }: VerifyPageProps) {
  const { t } = useTranslation()

  return (
    <DefaultLayout
      pageTitle={t('common:pageTitles.My Verification')}
      panelPadding
    >
      <VerificationTemplate stripe={stripe} />
    </DefaultLayout>
  )
}

export const getServerSideProps: GetServerSideProps<VerifyPageProps> = async (
  context
) => {
  // Verify authentication
  const user = await getAuthenticatedUser(context)
  if (!user) {
    return handleUnauthenticatedRedirect(context.resolvedUrl)
  }

  // Confirm stripe key is available
  if (!Environment.stripeKey) {
    return {
      redirect: {
        destination: urls.myProfile,
        permanent: false,
      },
    }
  }

  const stripePromise = loadStripe(Environment.stripeKey)
  const stripe = await stripePromise

  return {
    props: {
      stripe,
    },
  }
}
