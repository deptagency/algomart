import { Payment, PaymentStatus } from '@algomart/schemas'
import { GetServerSideProps } from 'next'
import { useRouter } from 'next/router'
import useTranslation from 'next-translate/useTranslation'
import { useEffect, useState } from 'react'

import { ApiClient } from '@/clients/api-client'
import Loading from '@/components/loading/loading'
import { useAuth } from '@/contexts/auth-context'
import DefaultLayout from '@/layouts/default-layout'
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
  const { user } = useAuth()
  const { push } = useRouter()
  const [isLoading, setIsLoading] = useState(true)
  const [isOwner, setIsOwner] = useState(false)

  useEffect(() => {
    if (user?.uid) setIsLoading(false)
  }, [user, push])

  useEffect(() => {
    // Confirm logged-in user is owner of pack
    // Done here instead of server side props to avoid redirect issue
    if (!isLoading && payment?.payer?.externalId !== user.uid) {
      push(urls.home)
    } else {
      setIsOwner(true)
    }
  }, [payment?.payer?.externalId, isLoading, push, user?.uid])

  return (
    <DefaultLayout
      pageTitle={
        status === Status.success
          ? t('common:statuses.Success!')
          : t('common:statuses.An Error has Occurred')
      }
      panelPadding
    >
      {isLoading || !isOwner ? (
        <Loading variant="primary" />
      ) : (
        <PaymentStatusTemplate payment={payment} status={status} />
      )}
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

  return {
    props: { payment, status: status as Status },
  }
}
