import { Payment, PaymentStatus } from '@algomart/schemas'
import { GetServerSideProps } from 'next'
import { useRouter } from 'next/router'
import useTranslation from 'next-translate/useTranslation'
import { useCallback } from 'react'

import { ApiClient } from '@/clients/api-client'
import Breadcrumbs from '@/components/breadcrumbs'
import Button from '@/components/button'
import { Flex } from '@/components/flex'
import Panel from '@/components/panel'
import useAdminGate from '@/hooks/use-admin-gate'
import DefaultLayout from '@/layouts/default-layout'
import adminService from '@/services/admin-service'
import { isAuthenticatedUserAdmin } from '@/services/api/auth-service'
import { useAuthApi } from '@/utils/swr'
import { urls } from '@/utils/urls'

interface AdminTransactionPageProps {
  payment: Payment
}

export default function AdminTransactionPage({
  payment,
}: AdminTransactionPageProps) {
  useAdminGate()
  const { t } = useTranslation('admin')
  const { query } = useRouter()
  const { transactionId } = query
  console.log('payment:', payment)

  const { data } = useAuthApi<Payment[]>(
    `${urls.api.v1.admin.getPaymentsForBankAccount}?bankAccountId=${payment.paymentBankId}`
  )
  console.log('all payments for bank account:', data)

  const handleReset = useCallback(async () => {
    const paymentId = typeof transactionId === 'string' ? transactionId : null
    const updatedPayment = await adminService.updatePayment(paymentId, {
      externalId: '',
      status: PaymentStatus.Pending,
    })
    console.log('reset payment:', updatedPayment)
  }, [transactionId])

  const markAsPaid = useCallback(async () => {
    const paymentId = typeof transactionId === 'string' ? transactionId : null
    const updatedPayment = await adminService.updatePayment(paymentId, {
      status: PaymentStatus.Paid,
    })
    console.log('marked payment as paid:', updatedPayment)
  }, [transactionId])

  const handleRevokePack = useCallback(async () => {
    // @TODO: Revoke pack API request
  }, [])

  return (
    <DefaultLayout
      pageTitle={t('common:pageTitles.Transaction')}
      noPanel
      width="full"
    >
      <Breadcrumbs
        breadcrumbs={[
          { label: 'Transactions', href: urls.admin.transactions },
          { label: transactionId as string },
        ]}
      />
      <Flex gap={6}>
        <Flex item flex="0 0 20rem">
          <Panel />
        </Flex>
        <Flex flex="1" flexDirection="column">
          <Panel title={t('common:pageTitles.Transaction')}>
            {/**** @TODO: Transaction template *****/}
            <Button className="mb-5" onClick={handleReset} fullWidth>
              {t('common:actions.Reset Payment')}
            </Button>
            <Button className="mb-5" onClick={markAsPaid} fullWidth>
              {t('common:actions.Set Payment As Successful')}
            </Button>
            <Button className="mb-5" onClick={handleRevokePack} fullWidth>
              {t('common:actions.Revoke Pack')}
            </Button>
          </Panel>
        </Flex>
      </Flex>
    </DefaultLayout>
  )
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  // Check if the user is admin (check again on render, to prevent caching of claims)
  const user = await isAuthenticatedUserAdmin(context)
  if (!user) {
    return {
      redirect: {
        destination: '/',
        permanent: false,
      },
    }
  }

  const { transactionId } = context.query
  const paymentId = typeof transactionId === 'string' ? transactionId : null

  // Redirect to Transactions if no transactionId is provided
  if (!paymentId) {
    return {
      redirect: {
        destination: urls.adminTransactions,
        permanent: false,
      },
    }
  }

  // Retrieve payment
  const payment = await ApiClient.instance
    .getAdminPaymentById(paymentId)
    .catch(() => null)

  // Redirect to Transactions page if payment not found
  if (!payment) {
    return {
      redirect: {
        destination: urls.adminTransactions,
        permanent: false,
      },
    }
  }

  return {
    props: {
      payment,
    },
  }
}
