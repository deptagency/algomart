import {
  AdminPaymentBase,
  AdminPaymentList,
  PaymentSortField,
} from '@algomart/schemas'
import { RefreshIcon } from '@heroicons/react/outline'
import { GetServerSideProps } from 'next'
import useTranslation from 'next-translate/useTranslation'

import AppLink from '@/components/app-link/app-link'
import Pagination from '@/components/pagination/pagination'
import Panel from '@/components/panel'
import Table from '@/components/table'
import { ColumnDefinitionType } from '@/components/table'
import useAdminGate from '@/hooks/use-admin-gate'
import usePagination from '@/hooks/use-pagination'
import DefaultLayout from '@/layouts/default-layout'
import { isAuthenticatedUserAdmin } from '@/services/api/auth-service'
import { getPaymentsFilterQuery } from '@/utils/filters'
import { formatCurrency } from '@/utils/format-currency'
import { useAuthApi } from '@/utils/swr'
import { urls } from '@/utils/urls'

const PAYMENTS_PER_PAGE = 10

export default function AdminTransactionsPage() {
  const { t, lang } = useTranslation('admin')

  useAdminGate()

  const { page, setPage, handleTableHeaderClick, sortBy, sortDirection } =
    usePagination<PaymentSortField>(1, PaymentSortField.CreatedAt)

  const qp = getPaymentsFilterQuery({
    page,
    sortBy,
    sortDirection,
    pageSize: PAYMENTS_PER_PAGE,
  })
  const { data, isValidating } = useAuthApi<AdminPaymentList>(
    `${urls.api.v1.admin.getPayments}?${qp}`
  )

  const columns: ColumnDefinitionType<AdminPaymentBase>[] = [
    {
      key: 'pack.title',
      name: t('transactions.table.title'),
      renderer: ({ value, item }) => (
        <AppLink
          href={urls.admin.transaction.replace(':transactionId', item.id)}
        >
          {value}
        </AppLink>
      ),
    },
    {
      key: 'createdAt',
      name: t('transactions.table.date'),
      renderer: ({ value }) =>
        value ? new Date(value).toLocaleDateString(lang) : null,
      sortable: true,
    },
    {
      key: 'pack.price',
      name: t('transactions.table.price'),
      renderer: ({ value }) => formatCurrency(value, lang),
    },
    { key: 'status', name: t('transactions.table.status'), sortable: true },
  ]

  const footer = (
    <>
      <div>
        <Pagination
          currentPage={page}
          total={data?.total || 0}
          pageSize={PAYMENTS_PER_PAGE}
          setPage={setPage}
        />
      </div>
      {data?.total > 0 && <div>{data.total} records found</div>}
    </>
  )

  return (
    <DefaultLayout
      pageTitle={t('common:pageTitles.Transactions')}
      noPanel
      width="full"
    >
      <Panel
        fullWidth
        title={t('common:pageTitles.Transactions')}
        contentRight={
          isValidating && <RefreshIcon className="w-5 h-5 animate-spin" />
        }
        footer={footer}
      >
        <div className="overflow-x-auto">
          <Table<AdminPaymentBase>
            columns={columns}
            data={data?.payments}
            onHeaderClick={handleTableHeaderClick}
            sortBy={sortBy}
            sortDirection={sortDirection as any}
          />
        </div>
      </Panel>
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

  return {
    props: {},
  }
}
