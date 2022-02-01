import { Payment, PaymentStatus } from '@algomart/schemas'
import { GetServerSideProps } from 'next'
import { useRouter } from 'next/router'
import useTranslation from 'next-translate/useTranslation'
import { useCallback } from 'react'

import { ApiClient } from '@/clients/api-client'
import Button from '@/components/button'
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
      {/**** @TODO: Transaction template *****/}
      <Button onClick={handleReset}>{t('common:actions.Reset Payment')}</Button>
      <Button onClick={markAsPaid}>
        {t('common:actions.Set Payment As Successful')}
      </Button>
      <Button onClick={handleRevokePack}>
        {t('common:actions.Revoke Pack')}
      </Button>
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
