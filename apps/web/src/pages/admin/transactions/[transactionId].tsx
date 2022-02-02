import { AdminPaymentBase, Payment, PaymentStatus } from '@algomart/schemas'
import { GetServerSideProps } from 'next'
import Image from 'next/image'
import { useRouter } from 'next/router'
import useTranslation from 'next-translate/useTranslation'
import { useCallback } from 'react'

import { ApiClient } from '@/clients/api-client'
import Breadcrumbs from '@/components/breadcrumbs'
import Button from '@/components/button'
import { Flex } from '@/components/flex'
import Heading from '@/components/heading'
import Panel from '@/components/panel'
import Table from '@/components/table'
import { ColumnDefinitionType } from '@/components/table'
import useAdminGate from '@/hooks/use-admin-gate'
import AdminLayout from '@/layouts/admin-layout'
import adminService from '@/services/admin-service'
import { isAuthenticatedUserAdmin } from '@/services/api/auth-service'
import { formatCurrency } from '@/utils/format-currency'
import { useAuthApi } from '@/utils/swr'
import { urls } from '@/utils/urls'

const getPaymentType = (payment: Payment) => {
  if (payment.paymentBankId) {
    return 'Wire Transfer'
  } else if (payment.paymentCardId) {
    return 'Credit Card'
  } else if (payment.destinationAddress) {
    return 'Crypto Transfer'
  }
  return 'Unknown'
}

interface AdminTransactionPageProps {
  payment: AdminPaymentBase
}

export default function AdminTransactionPage({
  payment,
}: AdminTransactionPageProps) {
  useAdminGate()
  const { t, lang } = useTranslation('admin')
  const { query } = useRouter()
  const { transactionId } = query
  const { pack, paymentBankId, payerId } = payment

  const { data } = useAuthApi<Payment[]>(
    `${urls.api.v1.admin.getPaymentsForBankAccount}?bankAccountId=${paymentBankId}`
  )
  console.log('all payments for bank account:', data)

  const columns: ColumnDefinitionType<Payment>[] = [
    {
      key: 'createdAt',
      name: t('transactions.table.date'),
      renderer: ({ value }) =>
        value ? new Date(value).toLocaleTimeString(lang) : null,
    },
    {
      key: 'type',
      name: 'Type',
      renderer: ({ item }) => getPaymentType(item),
    },
    {
      key: 'pack.price',
      name: t('transactions.table.price'),
      renderer: ({ value }) => formatCurrency(value, lang),
    },
    { key: 'status', name: t('transactions.table.status') },
  ]

  const handleReset = useCallback(async () => {
    if (!confirm('Are you sure you want to reset this transaction?')) return
    const paymentId = typeof transactionId === 'string' ? transactionId : null
    const updatedPayment = await adminService.updatePayment(paymentId, {
      externalId: '',
      status: PaymentStatus.Pending,
    })
    console.log('reset payment:', updatedPayment)
  }, [transactionId])

  const markAsPaid = useCallback(async () => {
    if (!confirm('Are you sure you want to mark this transaction as paid?'))
      return
    const paymentId = typeof transactionId === 'string' ? transactionId : null
    const updatedPayment = await adminService.updatePayment(paymentId, {
      status: PaymentStatus.Paid,
    })
    console.log('marked payment as paid:', updatedPayment)
  }, [transactionId])

  const handleRevokePack = useCallback(async () => {
    if (!confirm('Are you sure you want to revoke this pack?')) return
    // @TODO: Revoke pack API request
  }, [])

  return (
    <AdminLayout pageTitle={t('common:pageTitles.Transaction')}>
      <Breadcrumbs
        breadcrumbs={[
          { label: 'Transactions', href: urls.admin.transactions },
          { label: transactionId as string },
        ]}
      />
      <Flex gap={12}>
        <Flex item flex="0 0 250px">
          <Image src={pack.image} width={250} height={250} alt="Pack image" />
        </Flex>

        <Flex flex="1" flexDirection="column" gap={6}>
          <div>
            <Heading>{pack.title}</Heading>
            <p className="capitalize text-base-textTertiary">{pack.type}</p>
          </div>

          <Panel>
            <Flex alignItems="stretch" gap={4}>
              <Flex item flex="1">
                <small>Winning Bid</small>
                <p>{formatCurrency(pack.price, lang)} </p>
              </Flex>
              <Flex item flex="1">
                <small>Winner</small>
                <p>{payerId} </p>
              </Flex>
              <Flex item flex="1">
                <small>Ended At</small>
                <p>{pack.auctionUntil} </p>
              </Flex>
            </Flex>
          </Panel>

          <Panel title={t('common:pageTitles.Transactions')} fullWidth>
            <Table columns={columns} data={data} />
          </Panel>

          <Panel title={t('common:actions.Reset Payment')}>
            <p className="pb-4 text-sm text-base-textTertiary">
              Resetting the transaction puts it back into the pending state
              which allows the buyer to attept to make the payment again using
              the original wire instructions.
            </p>
            <Button onClick={handleReset} size="small">
              {t('common:actions.Reset Payment')}
            </Button>
          </Panel>

          <Panel title={t('common:actions.Set Payment As Successful')}>
            <p className="pb-4 text-sm text-base-textTertiary">
              Setting the payment as successful will mark the transaction as
              paid. Use this action when a payment is made through any means
              outside of the system.
            </p>
            <Button onClick={markAsPaid} size="small">
              {t('common:actions.Set Payment As Successful')}
            </Button>
          </Panel>

          <Panel title={t('common:actions.Revoke Pack')}>
            <p className="pb-4 text-sm text-base-textTertiary">
              Under the circumstance someone fails to pay you can revoke the
              NFT. Re-selling/auctioning revoked NFT packs is not yet supported
              so under this circumstance the simplest route would be to create a
              new pack/NFT.
            </p>
            <Button onClick={handleRevokePack} size="small">
              {t('common:actions.Revoke Pack')}
            </Button>
          </Panel>
        </Flex>
      </Flex>
    </AdminLayout>
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
