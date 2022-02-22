import { Payment, Payments, PaymentSortField } from '@algomart/schemas'
import { RefreshIcon } from '@heroicons/react/outline'
import { GetServerSideProps } from 'next'
import useTranslation from 'next-translate/useTranslation'

import AppLink from '@/components/app-link/app-link'
import Breadcrumbs from '@/components/breadcrumbs'
import Pagination from '@/components/pagination/pagination'
import Panel from '@/components/panel'
import Table from '@/components/table'
import { ColumnDefinitionType } from '@/components/table'
import usePagination from '@/hooks/use-pagination'
import AdminLayout from '@/layouts/admin-layout'
import { isAuthenticatedUserAdmin } from '@/services/api/auth-service'
import { getPaymentsFilterQuery } from '@/utils/filters'
import { formatCurrency } from '@/utils/format-currency'
import { useAuthApi } from '@/utils/swr'
import { urls } from '@/utils/urls'

const PAYMENTS_PER_PAGE = 10

export default function AdminTransactionsPage() {
  const { t, lang } = useTranslation('admin')
  const { page, setPage, handleTableHeaderClick, sortBy, sortDirection } =
    usePagination<PaymentSortField>(1, PaymentSortField.CreatedAt)

  const qp = getPaymentsFilterQuery({
    page,
    sortBy,
    sortDirection,
    pageSize: PAYMENTS_PER_PAGE,
  })
  const { data, isValidating } = useAuthApi<Payments>(
    `${urls.api.v1.admin.getPayments}?${qp}`
  )

  const columns: ColumnDefinitionType<Payment>[] = [
    {
      key: 'pack.template.title',
      name: t('transactions.table.Title'),
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
      name: t('transactions.table.Date'),
      renderer: ({ value }) =>
        value ? new Date(value).toLocaleDateString(lang) : null,
      sortable: true,
    },
    {
      key: 'pack.template.activeBid',
      name: t('transactions.table.Amount'),
      renderer: ({ item }) =>
        item.pack.template.activeBid
          ? formatCurrency(item.pack.template.activeBid, lang)
          : formatCurrency(item.pack.template.price, lang),
    },
    {
      key: 'pack.template.type',
      name: t('transactions.table.Type'),
      sortable: false,
    },
    { key: 'status', name: t('transactions.table.Status'), sortable: true },
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
    <AdminLayout pageTitle={t('common:pageTitles.Transactions')}>
      <Breadcrumbs
        breadcrumbs={[
          { label: 'Admin', href: urls.admin.index },
          { label: 'Transactions' },
        ]}
      />
      <Panel
        fullWidth
        title={t('common:pageTitles.Transactions')}
        contentRight={
          isValidating && <RefreshIcon className="w-5 h-5 animate-spin" />
        }
        footer={footer}
      >
        <div className="overflow-x-auto">
          <Table<Payment>
            columns={columns}
            data={data?.payments}
            onHeaderClick={handleTableHeaderClick}
            sortBy={sortBy}
            sortDirection={sortDirection as any}
          />
        </div>
      </Panel>
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

  return {
    props: {},
  }
}
