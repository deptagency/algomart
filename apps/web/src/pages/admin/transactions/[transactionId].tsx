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
import { logger } from '@/utils/logger'
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
    try {
      const updatedPayment = await adminService.updatePayment(paymentId, {
        externalId: '',
        status: PaymentStatus.Pending,
      })
      console.log('reset payment:', updatedPayment)
    } catch (error) {
      logger.error(error, 'Unable to reset pack')
    }
  }, [transactionId])

  const markAsPaid = useCallback(async () => {
    const paymentId = typeof transactionId === 'string' ? transactionId : null
    try {
      const updatedPayment = await adminService.updatePayment(paymentId, {
        status: PaymentStatus.Paid,
      })
      console.log('marked payment as paid:', updatedPayment)
    } catch (error) {
      logger.error(error, 'Unable to update pack as paid')
    }
  }, [transactionId])

  const handleRevokePack = useCallback(async () => {
    try {
      console.log('payment:', payment.pack)
      if (!payment.pack.id) throw new Error('No pack id')
      if (!payment.pack.ownerId) throw new Error('No pack owner ID')
      await adminService.revokePack(payment.pack.id, payment.pack.ownerId)
    } catch (error) {
      logger.error(error, 'Unable to revoke pack')
    }
  }, [payment?.pack])

  return (
    <DefaultLayout pageTitle={t('common:pageTitles.Transaction')}>
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
