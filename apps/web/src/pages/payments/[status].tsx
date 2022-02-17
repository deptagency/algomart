import { Payment, PaymentStatus } from '@algomart/schemas'
import { GetServerSideProps } from 'next'
import useTranslation from 'next-translate/useTranslation'

import { ApiClient } from '@/clients/api-client'
import DefaultLayout from '@/layouts/default-layout'
import {
  getAuthenticatedUser,
  handleUnauthenticatedRedirect,
} from '@/services/api/auth-service'
import PaymentStatusTemplate from '@/templates/payment-status-template'
import { urls } from '@/utils/urls'

export enum Status {
  success = 'success',
  failure = 'failure',
}

export interface StatusPageProps {
  payment: Payment
  status: Status
}

export default function ResolvedPayment({ payment, status }: StatusPageProps) {
  const { t } = useTranslation()
  return (
    <DefaultLayout
      pageTitle={
        status === Status.success
          ? t('common:statuses.Success!')
          : t('common:statuses.An Error has Occurred')
      }
      panelPadding
    >
      <PaymentStatusTemplate payment={payment} status={status} />
    </DefaultLayout>
  )
}

export const getServerSideProps: GetServerSideProps<StatusPageProps> = async (
  context
) => {
  const { status } = context.params
  // Status is required
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

  // Confirm the payment is in the correct status
  const acceptableSuccessStatuses = new Set([
    PaymentStatus.Confirmed,
    PaymentStatus.ActionRequired,
    PaymentStatus.Paid,
  ])
  const acceptableFailedStatuses = new Set([
    PaymentStatus.ActionRequired,
    PaymentStatus.Failed,
  ])
  if (
    (status === Status.success &&
      !acceptableSuccessStatuses.has(payment.status)) ||
    (status === Status.failure && !acceptableFailedStatuses.has(payment.status))
  ) {
    return {
      redirect: {
        destination: urls.releases,
        permanent: false,
      },
    }
  }

  // Confirm logged-in user is owner of pack
  if (payment?.payer?.externalId !== user.externalId) {
    return {
      redirect: {
        destination: urls.releases,
        permanent: false,
      },
    }
  }

  return {
    props: { payment, status: status as Status },
  }
}
