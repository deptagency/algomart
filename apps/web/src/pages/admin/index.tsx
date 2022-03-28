import { GetServerSideProps } from 'next'
import useTranslation from 'next-translate/useTranslation'

import Breadcrumbs from '@/components/breadcrumbs'
import Tabs from '@/components/tabs/tabs'
import AdminLayout from '@/layouts/admin-layout'
import { isAuthenticatedUserAdmin } from '@/services/api/auth-service'
import { urls } from '@/utils/urls'

export default function AdminPage() {
  const { t, lang } = useTranslation('admin')

  return (
    <AdminLayout pageTitle={t('common:pageTitles.Admin')}>
      <Breadcrumbs breadcrumbs={[{ label: 'Admin' }]} />
      <Tabs
        activeTab={-1}
        tabs={[
          {
            href: urls.admin.transactions,
            label: t('common:pageTitles.Transactions'),
          },
          { href: urls.admin.users, label: t('common:pageTitles.Users') },
        ]}
      />
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
