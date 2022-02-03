import { Payment, PaymentStatus, WirePayment } from '@algomart/schemas'
import { GetServerSideProps } from 'next'
import Image from 'next/image'
import { useRouter } from 'next/router'
import useTranslation from 'next-translate/useTranslation'
import { useCallback } from 'react'

import css from './transaction.module.css'

import { ApiClient } from '@/clients/api-client'
import AppLink from '@/components/app-link/app-link'
import Avatar from '@/components/avatar/avatar'
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
import { logger } from '@/utils/logger'
import { useAuthApi } from '@/utils/swr'
import { urls } from '@/utils/urls'
interface AdminTransactionPageProps {
  payment: Payment
}

export default function AdminTransactionPage({
  payment,
}: AdminTransactionPageProps) {
  useAdminGate()
  const { t, lang } = useTranslation('admin')
  const { query } = useRouter()
  const { transactionId } = query

  // WIRE PAYMENTS
  const { data } = useAuthApi<WirePayment[]>(
    `${urls.api.v1.admin.getPaymentsForBankAccount}?bankAccountId=${payment.paymentBankId}`
  )

  const columns: ColumnDefinitionType<WirePayment>[] = [
    {
      key: 'createdAt',
      name: t('transactions.table.date'),
      renderer: ({ value }) =>
        value ? new Date(value).toLocaleString(lang) : null,
    },
    {
      key: 'pack.price',
      name: t('transactions.table.price'),
      renderer: ({ value }) => formatCurrency(value, lang),
    },
    { key: 'status', name: t('transactions.table.status') },
    { key: 'type', name: 'Type' },
  ]

  // CALLBACKS
  const handleReset = useCallback(async () => {
    if (!confirm('Are you sure you want to reset this transaction?')) return
    const paymentId = typeof transactionId === 'string' ? transactionId : null
    try {
      const updatedPayment = await adminService.updatePayment(paymentId, {
        externalId: '',
        status: PaymentStatus.Pending,
      })
      logger.info(updatedPayment, 'Payment was reset')
    } catch (error) {
      logger.error(error, 'Unable to reset pack')
    }
  }, [transactionId])

  const markAsPaid = useCallback(async () => {
    if (!confirm('Are you sure you want to mark this transaction as paid?'))
      return
    const paymentId = typeof transactionId === 'string' ? transactionId : null
    try {
      const updatedPayment = await adminService.updatePayment(paymentId, {
        status: PaymentStatus.Paid,
      })
      logger.info(updatedPayment, 'Payment marked as paid')
    } catch (error) {
      logger.error(error, 'Unable to update pack as paid')
    }
  }, [transactionId])

  const handleRevokePack = useCallback(async () => {
    if (!confirm('Are you sure you want to revoke this pack?')) return
    // @TODO: Revoke pack API request
    try {
      if (!payment.pack.id) throw new Error('No pack id')
      if (!payment.pack.ownerId) throw new Error('No pack owner ID')
      // Revoke pack
      await adminService.revokePack(payment.pack.id, payment.pack.ownerId)
      logger.info('Pack was revoked')
    } catch (error) {
      logger.error(error, 'Unable to revoke pack')
    }
  }, [payment.pack.id, payment.pack.ownerId])

  return (
    <AdminLayout pageTitle={t('common:pageTitles.Transaction')}>
      <Breadcrumbs
        breadcrumbs={[
          { label: 'Transactions', href: urls.admin.transactions },
          { label: transactionId as string },
        ]}
      />
      <Flex gap={12}>
        <Flex item flex="0 0 250px" className="overflow-hidden" gap={2}>
          <Panel fullWidth>
            <Image
              src={payment.pack.image}
              layout="responsive"
              height="100%"
              width="100%"
              alt="Pack image"
            />
          </Panel>

          <Flex flex="1" flexDirection="column" gap={6}>
            <Panel className={css.userInfoPanel}>
              <dl>
                <dt>Type</dt>
                <dd>{payment.pack.type}</dd>
                <dt>Title</dt>
                <dd>{payment.pack.title}</dd>
                <dt>Slug</dt>
                <dd>
                  <AppLink
                    href={urls.release.replace(':packSlug', payment.pack.slug)}
                  >
                    {payment.pack.slug}
                  </AppLink>
                </dd>
                <dt>Price</dt>
                <dd>{formatCurrency(payment.pack.price, lang)}</dd>
                <dt>Template ID</dt>
                <dd>{payment.pack.templateId}</dd>
              </dl>
            </Panel>

            <Panel className={css.userInfoPanel} title="Purchaser">
              <Flex gap={2} className="overflow-hidden">
                <Avatar username={payment.payer?.username} />
              </Flex>
              <dl>
                <dt>Email</dt>
                <dd>{payment.payer?.email}</dd>
                <dt>ID</dt>
                <dd>{payment.payer?.id}</dd>
                <dt>External ID</dt>
                <dd>{payment.payer?.externalId}</dd>
                <dt>Algorand Account ID</dt>
                <dd>{payment.payer?.algorandAccountId}</dd>
              </dl>
            </Panel>
          </Flex>
        </Flex>

        <Flex flex="1" flexDirection="column" gap={6}>
          <Panel>
            <Flex alignItems="stretch" gap={4} Element="dl">
              <div className={css.packMeta}>
                <dt>Winning Bid</dt>
                <dd>{formatCurrency(payment.amount, lang)} </dd>
              </div>
              <div className={css.packMeta}>
                <dt>Winner</dt>
                <dd>{payment.payer?.username} </dd>
              </div>
              <div className={css.packMeta}>
                <dt>Ended At</dt>
                <dd>
                  {new Date(payment.pack.auctionUntil).toLocaleString(lang)}{' '}
                </dd>
              </div>
            </Flex>
          </Panel>

          <Panel title={t('common:pageTitles.Transactions')} fullWidth>
            <Table<WirePayment> columns={columns} data={data} />
          </Panel>

          <Panel title={t('common:actions.Reset Payment')}>
            <p className={css.actionDescription}>
              Resetting the transaction puts it back into the pending state
              which allows the buyer to attept to make the payment again using
              the original wire instructions.
            </p>
            <Button
              onClick={handleReset}
              size="small"
              disabled={payment?.status === PaymentStatus.Pending}
            >
              {t('common:actions.Reset Payment')}
            </Button>
          </Panel>

          <Panel title={t('common:actions.Set Payment As Successful')}>
            <p className={css.actionDescription}>
              Setting the payment as successful will mark the transaction as
              paid. Use this action when a payment is made through any means
              outside of the system.
            </p>
            <Button
              onClick={markAsPaid}
              size="small"
              disabled={payment?.status === PaymentStatus.Paid}
            >
              {t('common:actions.Set Payment As Successful')}
            </Button>
          </Panel>

          <Panel title={t('common:actions.Revoke Pack')}>
            <p className={css.actionDescription}>
              If someone fails to pay you can revoke the pack. Note:
              Re-selling/auctioning revoked packs is not yet supported.
            </p>
            <Button
              onClick={handleRevokePack}
              size="small"
              disabled={!payment?.pack?.ownerId}
            >
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
