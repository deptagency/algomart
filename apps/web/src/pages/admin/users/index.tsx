import {
  FirebaseClaim,
  UserAccount,
  UserAccounts,
  UserSortField,
} from '@algomart/schemas'
import RefreshIcon from '@heroicons/react/outline/esm/RefreshIcon'
import debounce from 'lodash/debounce'
import { GetServerSideProps } from 'next'
import useTranslation from 'next-translate/useTranslation'
import { useCallback, useMemo, useState } from 'react'

import Breadcrumbs from '@/components/breadcrumbs'
import Checkbox from '@/components/checkbox'
import Pagination from '@/components/pagination/pagination'
import Panel from '@/components/panel'
import Table from '@/components/table'
import { ColumnDefinitionType } from '@/components/table'
import TextInput from '@/components/text-input/text-input'
import usePagination from '@/hooks/use-pagination'
import AdminLayout from '@/layouts/admin-layout'
import { AdminService } from '@/services/admin-service'
import { isAuthenticatedUserAdmin } from '@/services/api/auth-service'
import { getUsersFilterQuery } from '@/utils/filters'
import { useAuthApi } from '@/utils/swr'
import { urls } from '@/utils/urls'

const USERS_PER_PAGE = 10

interface Role {
  id: FirebaseClaim
  label: string
}

interface RendererProps {
  value: any
  item: UserAccount
  colKey: string
}

interface CheckRoleProps {
  user: UserAccount
  role: Role
}

function CheckRole({ user, role }: CheckRoleProps) {
  const { t } = useTranslation('admin')
  const [checked, setChecked] = useState(user.claims.includes(role.id))

  const updateClaim = useCallback(async () => {
    // Confirm that's their intention. Alternatively, consider a dropdown menu
    // https://github.com/deptagency/algomart/pull/325#discussion_r826354494
    const confirmMessage = t(`users.${checked ? 'removeRole' : 'addRole'}`, {
      username: user.username,
      role: role.id,
    })
    if (!window.confirm(confirmMessage)) {
      return
    }

    // show in UI before it goes through
    setChecked(!checked)
    const updatedClaims = await AdminService.instance.updateClaims(
      user.externalId,
      role.id,
      !checked
    )
    // Then update with server-side result
    setChecked(updatedClaims.claims.includes(role.id))
  }, [checked])

  return (
    <Checkbox label={role.label} checked={checked} onChange={updateClaim} />
  )
}

export default function AdminUsersPage() {
  const { t, lang } = useTranslation('admin')
  const [search, setSearch] = useState('')
  const [searchDebounced, setSearchDebounced] = useState('')

  const { page, setPage, handleTableHeaderClick, sortBy, sortDirection } =
    usePagination<UserSortField>(1, UserSortField.CreatedAt)

  const rolesArray = useMemo<Role[]>(
    () =>
      Object.values(FirebaseClaim).map((id) => ({
        id,
        label: t(`users.roles.${id}`),
      })),
    []
  )

  const qp = getUsersFilterQuery({
    page,
    sortBy,
    sortDirection,
    pageSize: USERS_PER_PAGE,
    search: searchDebounced,
  })
  const { data, isValidating } = useAuthApi<UserAccounts>(
    `${urls.api.v1.admin.getUsers}?${qp}`
  )
  const users = data?.users || []
  const total = data?.total || 0

  const renderClaims = useCallback(
    ({ item }: RendererProps) =>
      rolesArray.map((role) => (
        <CheckRole
          key={`${item.externalId}-${role.id}`}
          user={item}
          role={role}
        />
      )),
    []
  )

  const submitSearch = useCallback(
    debounce((value) => {
      setSearchDebounced(value)
    }, 200),
    []
  )

  const handleSearchChange = useCallback((value) => {
    setSearch(value)
    submitSearch(value)
  }, [])

  const columns: ColumnDefinitionType<UserAccount>[] = [
    {
      key: 'username',
      name: t('users.table.Username'),
      sortable: true,
    },
    {
      key: 'email',
      name: t('users.table.Email'),
      sortable: true,
    },
    {
      key: 'createdAt',
      name: t('users.table.Created'),
      renderer: ({ value }) =>
        value ? new Date(value).toLocaleDateString(lang) : null,
      sortable: true,
    },
    {
      key: 'claims',
      name: t('users.table.Role'),
      renderer: renderClaims,
    },
  ]

  const searchBox = (
    <div className={'m-5'}>
      <TextInput
        handleChange={handleSearchChange}
        placeholder={'Search by email or username'}
        value={search}
      />
    </div>
  )

  const footer = (
    <>
      <div>
        <Pagination
          currentPage={page}
          total={total}
          pageSize={USERS_PER_PAGE}
          setPage={setPage}
        />
      </div>
      {total > 0 && <div>{total} records found</div>}
    </>
  )

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
        contentRight={
          isValidating && <RefreshIcon className="w-5 h-5 animate-spin" />
        }
        footer={footer}
      >
        {searchBox}
        <div className="overflow-x-auto">
          <Table
            columns={columns}
            data={users}
            onHeaderClick={handleTableHeaderClick}
            sortBy={sortBy}
            sortDirection={sortDirection}
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
