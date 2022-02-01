import { GetServerSideProps } from 'next'
import useTranslation from 'next-translate/useTranslation'

import Panel from '@/components/panel'
import useAdminGate from '@/hooks/use-admin-gate'
import DefaultLayout from '@/layouts/default-layout'
import { isAuthenticatedUserAdmin } from '@/services/api/auth-service'

export default function AdminTransactionsPage() {
  useAdminGate()
  const { t, lang } = useTranslation('admin')

  return (
    <DefaultLayout
      pageTitle={t('common:pageTitles.Transaction')}
      noPanel
      width="full"
    >
      <Panel title={t('common:pageTitles.Transaction')}>todo</Panel>
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
