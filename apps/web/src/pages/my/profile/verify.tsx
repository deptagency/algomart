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

  const stripe = await loadStripe(Environment.stripeKey)

  return {
    props: {
      stripe,
    },
  }
}
