import { Payment } from '@algomart/schemas'
import { GetServerSideProps } from 'next'
import useTranslation from 'next-translate/useTranslation'

import { ApiClient } from '@/clients/api-client'
import DefaultLayout from '@/layouts/default-layout'
import {
  getAuthenticatedUser,
  handleUnauthenticatedRedirect,
} from '@/services/api/auth-service'

export interface FailurePageProps {
  payment: Payment
}

export default function FailurePage({ payment }: FailurePageProps) {
  console.log('Failure payment:', payment)
  const { t } = useTranslation()
  return <DefaultLayout pageTitle="Failure!" panelPadding></DefaultLayout>
}

export const getServerSideProps: GetServerSideProps<FailurePageProps> = async (
  context
) => {
  const { paymentId: paymentExternalId } = context.query

  // Payment ID is required
  if (!paymentExternalId || typeof paymentExternalId !== 'string') {
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
  const isExternalId = true
  const payment = await ApiClient.instance.getPaymentById(
    paymentExternalId,
    isExternalId
  )

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
