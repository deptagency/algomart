import { Payment } from '@algomart/schemas'
import { GetServerSideProps } from 'next'
import useTranslation from 'next-translate/useTranslation'

import { ApiClient } from '@/clients/api-client'
import DefaultLayout from '@/layouts/default-layout'
import {
  getAuthenticatedUser,
  handleUnauthenticatedRedirect,
} from '@/services/api/auth-service'

export interface SuccessPageProps {
  payment: Payment
}

export default function SuccessPage({ payment }: SuccessPageProps) {
  console.log('Success payment:', payment)
  const { t } = useTranslation()
  return <DefaultLayout pageTitle="Success!" panelPadding></DefaultLayout>
}

export const getServerSideProps: GetServerSideProps<SuccessPageProps> = async (
  context
) => {
  const { paymentId } = context.query

  // Payment ID is required
  if (!paymentId || typeof paymentId !== 'string') {
    return {
      notFound: true,
    }
  }

  // Verify authentication
  const user = await getAuthenticatedUser(context)
  if (!user) {
    return handleUnauthenticatedRedirect(context.resolvedUrl)
  }

  // Get payment
  const payment = await ApiClient.instance.getPaymentById(paymentId)

  // Check if payment is found
  if (!payment) {
    return {
      notFound: true,
    }
  }

  // Confirm logged-in user is owner of pack
  if (payment.payerId !== user.id) {
    return {
      notFound: true,
    }
  }

  return {
    props: { payment },
  }
}
