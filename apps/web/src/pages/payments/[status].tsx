import { Payment } from '@algomart/schemas'
import { GetServerSideProps } from 'next'
import useTranslation from 'next-translate/useTranslation'

import { ApiClient } from '@/clients/api-client'
import DefaultLayout from '@/layouts/default-layout'
import {
  getAuthenticatedUser,
  handleUnauthenticatedRedirect,
} from '@/services/api/auth-service'
import PaymentFailureTemplate from '@/templates/payment-failure-template'
import PaymentSuccessTemplate from '@/templates/payment-success-template'

enum Status {
  success = 'success',
  failure = 'failure',
}

export interface SuccessPageProps {
  payment: Payment
  status: Status
}

export default function ResolvedPayment({ payment }: SuccessPageProps) {
  console.log('ResolvedPayment payment:', payment)
  const { t } = useTranslation()
  return (
    <DefaultLayout
      pageTitle={status === Status.success ? 'Success' : 'Failure'}
      panelPadding
    >
      {status === Status.success && <PaymentSuccessTemplate />}
      {status === Status.failure && <PaymentFailureTemplate />}
    </DefaultLayout>
  )
}

export const getServerSideProps: GetServerSideProps<SuccessPageProps> = async (
  context
) => {
  const { status } = context.params

  // Payment ID is required
  if (
    !status ||
    typeof status !== 'string' ||
    (status !== Status.success && status !== Status.failure)
  ) {
    return {
      notFound: true,
    }
  }

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
  if (payment?.payer?.externalId !== user.externalId) {
    return {
      notFound: true,
    }
  }

  return {
    props: { payment, status: status as Status },
  }
}
