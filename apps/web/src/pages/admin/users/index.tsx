import { UserAccount } from '@algomart/schemas'
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
import { formatCurrency } from '@/utils/format-currency'
import { useAuthApi } from '@/utils/swr'
import { urls } from '@/utils/urls'

const USERS_PER_PAGE = 10

export default function AdminUsersPage() {
  const { t, lang } = useTranslation('admin')
  // const { page, setPage, handleTableHeaderClick, sortBy, sortDirection } =
  //   usePagination<UserSortField>(1, UserSortField.CreatedAt)

  // const qp = getUsersFilterQuery({
  //   page,
  //   sortBy,
  //   sortDirection,
  //   pageSize: USERS_PER_PAGE,
  // })
  // const { data, isValidating } = useAuthApi<UserAccount>(
  //   `${urls.api.v1.admin.getUsers}?${qp}`
  // )

  const data = { users: [] }

  const columns: ColumnDefinitionType<UserAccount>[] = [
    {
      key: 'username',
      name: t('users.table.Username'),
    },
    {
      key: 'email',
      name: t('users.table.Email'),
    },
    {
      key: 'createdAt',
      name: t('users.table.Created'),
    },
  ]

  // const footer = (
  //   <>
  //     <div>
  //       <Pagination
  //         currentPage={page}
  //         total={data?.total || 0}
  //         pageSize={PAYMENTS_PER_PAGE}
  //         setPage={setPage}
  //       />
  //     </div>
  //     {data?.total > 0 && <div>{data.total} records found</div>}
  //   </>
  // )

  return (
    <AdminLayout pageTitle={t('common:pageTitles.Users')}>
      <Breadcrumbs
        breadcrumbs={[
          { label: 'Admin', href: urls.admin.index },
          { label: 'Users' },
        ]}
      />
      <Panel
        fullWidth
        title={t('common:pageTitles.Users')}
        // contentRight={
        //   isValidating && <RefreshIcon className="w-5 h-5 animate-spin" />
        // }
        // footer={footer}
      >
        <div className="overflow-x-auto">
          <Table<UserAccount>
            columns={columns}
            data={data?.users}
            // onHeaderClick={handleTableHeaderClick}
            // sortBy={sortBy}
            // sortDirection={sortDirection as any}
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
