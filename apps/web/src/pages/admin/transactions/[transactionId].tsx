import { Payment, PaymentStatus, WirePayment } from '@algomart/schemas'
import { GetServerSideProps } from 'next'
import Image from 'next/image'
import { useRouter } from 'next/router'
import useTranslation from 'next-translate/useTranslation'
import { useCallback, useState } from 'react'

import css from './transaction.module.css'

import { ApiClient } from '@/clients/api-client'
import AppLink from '@/components/app-link/app-link'
import Avatar from '@/components/avatar/avatar'
import Breadcrumbs from '@/components/breadcrumbs'
import Button from '@/components/button'
import { Flex } from '@/components/flex'
import Panel from '@/components/panel'
import Table from '@/components/table'
import { ColumnDefinitionType } from '@/components/table'
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
  const { t, lang } = useTranslation('admin')
  const { query } = useRouter()
  const { transactionId } = query
  const isAuction = !!payment.pack?.template?.auctionUntil

  // WIRE PAYMENTS
  const { data } = useAuthApi<WirePayment[]>(
    payment.paymentBankId
      ? `${urls.api.v1.admin.getPaymentsForBankAccount}?bankAccountId=${payment.paymentBankId}`
      : null
  )

  const columns: ColumnDefinitionType<WirePayment>[] = [
    {
      key: 'createdAt',
      name: t('transactions.table.Date'),
      renderer: ({ value }) =>
        value ? new Date(value).toLocaleString(lang) : null,
    },
    {
      key: 'pack.price',
      name: t('transactions.table.Amount'),
      renderer: ({ value }) => formatCurrency(value, lang),
    },
    { key: 'status', name: t('transactions.table.Status') },
    { key: 'type', name: t('transactions.table.Type') },
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
      alert('Payment was reset')
      logger.info('Payment was reset.', updatedPayment)
    } catch (error) {
      alert('Unable to reset pack.')
      logger.error('Unable to reset pack', error)
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
      alert('Payment was marked as paid')
      logger.info('Payment marked as paid.', updatedPayment)
    } catch (error) {
      alert('Unable to update pack as paid.')
      logger.error('Unable to update pack as paid', error)
    }
  }, [transactionId])

  const [isRevoking, setIsRevoking] = useState(false)
  const handleRevokePack = useCallback(async () => {
    if (!confirm('Are you sure you want to revoke this pack?')) return
    setIsRevoking(true)
    try {
      if (!payment.pack?.id) throw new Error('No pack id')
      if (!payment.pack?.ownerId) throw new Error('No pack owner ID')
      // Revoke pack
      await adminService.revokePack(payment.pack?.id, payment.pack?.ownerId)
      alert('Pack successfully revoked.')
      logger.info('Pack was revoked')
      setIsRevoking(false)
    } catch (error) {
      alert('Unable to revoke pack.')
      logger.error('Unable to revoke pack', error)
      setIsRevoking(false)
    }
  }, [payment.pack?.id, payment.pack?.ownerId])

  return (
    <AdminLayout pageTitle={t('common:pageTitles.Transaction')}>
      <Breadcrumbs
        breadcrumbs={[
          { label: 'Admin', href: urls.admin.index },
          { label: 'Transactions', href: urls.admin.transactions },
          { label: transactionId as string },
        ]}
      />
      <Flex gap={12}>
        <Flex item flex="0 0 auto" className={css.leftSide} gap={2}>
          <Panel fullWidth>
            <Image
              src={payment.pack?.template?.image}
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
                <dd>{payment.pack?.template?.type}</dd>
                <dt>Title</dt>
                <dd>{payment.pack?.template?.title}</dd>
                <dt>Slug</dt>
                <dd>
                  <AppLink
                    href={urls.release.replace(
                      ':packSlug',
                      payment.pack?.template?.slug
                    )}
                  >
                    {payment.pack?.template?.slug}
                  </AppLink>
                </dd>
                <dt>Price</dt>
                <dd>{formatCurrency(payment.pack?.template?.price, lang)}</dd>
                <dt>Template ID</dt>
                <dd>{payment.pack?.templateId}</dd>
              </dl>
            </Panel>

            <Panel
              className={css.userInfoPanel}
              title={t('transactions.Customer')}
            >
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
          {isAuction && (
            <Panel>
              <Flex alignItems="stretch" gap={4} Element="dl">
                <div className={css.packMeta}>
                  <dt>Winning Bid</dt>
                  <dd>
                    {formatCurrency(payment.pack?.template?.activeBid, lang)}
                  </dd>
                </div>
                <div className={css.packMeta}>
                  <dt>Winner</dt>
                  <dd>@{payment.payer?.username} </dd>
                </div>
                <div className={css.packMeta}>
                  <dt>Ended At</dt>
                  <dd>
                    {new Date(
                      payment.pack?.template?.auctionUntil
                    ).toLocaleString(lang)}
                  </dd>
                </div>
              </Flex>
            </Panel>
          )}

          <Panel title={t('common:pageTitles.Transactions')} fullWidth>
            <Table<WirePayment> columns={columns} data={data} />
          </Panel>

          <Panel title={t('transactions.resetPayment')}>
            <p className={css.actionDescription}>
              {t('transactions.resetPaymentDesc')}
            </p>
            <Button
              onClick={handleReset}
              size="small"
              disabled={payment?.status === PaymentStatus.Pending}
            >
              {t('transactions.resetPayment')}
            </Button>
          </Panel>

          <Panel title={t('transactions.markAsPaid')}>
            <p className={css.actionDescription}>
              {t('transactions.markAsPaidDesc')}
            </p>
            <Button
              onClick={markAsPaid}
              size="small"
              disabled={payment?.status === PaymentStatus.Paid}
            >
              {t('transactions.markAsPaid')}
            </Button>
          </Panel>

          <Panel title={t('transactions.revokePack')}>
            <p className={css.actionDescription}>
              {t('transactions.revokePackDesc')}
            </p>
            <Button
              onClick={handleRevokePack}
              size="small"
              disabled={!payment?.pack?.ownerId}
              busy={isRevoking}
            >
              {t('transactions.revokePack')}
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
