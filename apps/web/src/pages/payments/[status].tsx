import { Payment } from '@algomart/schemas'
import { GetServerSideProps } from 'next'
import useTranslation from 'next-translate/useTranslation'

import css from './status.module.css'

import Loading from '@/components/loading/loading'
import MainPanelHeader from '@/components/main-panel-header'
import { AppConfig } from '@/config'
import { useAuth } from '@/contexts/auth-context'
import DefaultLayout from '@/layouts/default-layout'
import {
  getAuthenticatedUser,
  getTokenFromCookie,
  handleUnauthenticatedRedirect,
} from '@/services/api/auth-service'
import PaymentStatusTemplate from '@/templates/payment-status-template'
import { apiFetcher } from '@/utils/react-query'
import { urlFor, urls } from '@/utils/urls'

export enum Status {
  pending = 'pending',
  pending_transfer = 'pending_transfer',
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
  const isLoading = !user?.uid

  const title = {
    [Status.success]: t('common:statuses.Success!'),
    [Status.failure]: t('common:statuses.An Error has Occurred'),
    [Status.pending]: t('common:statuses.Processing payment'),
    [Status.pending_transfer]: t('common:statuses.Payment Transfer Pending'),
  }[status]

  return (
    <DefaultLayout pageTitle={title}>
      <MainPanelHeader
        title={t('forms:purchaseCredits.Add Money')}
        backLink={urls.myWallet}
      />
      <div className={css.statusContainer}>
        {isLoading ? (
          <Loading />
        ) : (
          <PaymentStatusTemplate payment={payment} status={status} />
        )}
      </div>
    </DefaultLayout>
  )
}

export const getServerSideProps: GetServerSideProps<StatusPageProps> = async (
  context
) => {
  // Non-prod fix to redirect 127.0.0.1 to localhost
  // This happens due to Circle not allowing localhost in the 3DS callback URLs
  const [host, port] = context.req.headers.host?.split(':') ?? []
  if (!AppConfig.isProduction && host === '127.0.0.1') {
    return {
      redirect: {
        permanent: true,
        destination: `http://localhost:${port}${context.req.url}`,
      },
    }
  }

  // Ensure user is authenticated
  const user = await getAuthenticatedUser(context)
  if (!user) {
    return handleUnauthenticatedRedirect(context.resolvedUrl)
  }

  const { status } = context.params
  // Status is required
  if (
    !status ||
    typeof status !== 'string' ||
    (status !== Status.success &&
      status !== Status.failure &&
      status !== Status.pending_transfer &&
      status !== Status.pending)
  ) {
    return {
      notFound: true,
    }
  }

  const { paymentId } = context.query

  // Payment ID is required
  if (!paymentId || typeof paymentId !== 'string') {
    return {
      notFound: true,
    }
  }

  // Get payment
  const payment = await apiFetcher()
    .get<Payment>(urlFor(urls.api.payments.payment, { paymentId }), {
      bearerToken: getTokenFromCookie(context.req, context.res),
    })
    .then((p) => p)
    .catch(() => null)

  if (!payment) {
    return {
      notFound: true,
    }
  }

  return {
    props: { payment, status: status as Status },
  }
}
