import {
  CircleTransferStatus,
  UserAccountTransfersResponse,
} from '@algomart/schemas'
import { GetServerSideProps } from 'next'
import useTranslation from 'next-translate/useTranslation'
import { useState } from 'react'

import Loading from '@/components/loading/loading'
import { PAGE_SIZE } from '@/components/pagination/pagination'
import { useLanguage } from '@/contexts/language-context'
import { usePaymentsMissingTransfers } from '@/hooks/api/use-payments-missing-transfers'
import DefaultLayout from '@/layouts/default-layout'
import {
  getAuthenticatedUser,
  handleUnauthenticatedRedirect,
} from '@/services/api/auth-service'
import MyCreditsTemplate from '@/templates/my-credits-template'
import { useAPI } from '@/utils/react-query'
import { urlFor, urls } from '@/utils/urls'

export default function MyWalletPage() {
  const { t } = useTranslation()
  const [page, setPage] = useState(1)

  const { language } = useLanguage()

  const queryParams = {
    language,
    page,
    pageSize: PAGE_SIZE,
    status: [
      CircleTransferStatus.Complete,
      CircleTransferStatus.Pending,
      CircleTransferStatus.Failed,
    ],
  }
  const { data } = useAPI<UserAccountTransfersResponse>(
    ['search-transfers', queryParams],
    urlFor(urls.api.transfers.search, null, queryParams)
  )
  const { transfers, total } = data || {}

  const { data: paymentsReplyData } = usePaymentsMissingTransfers()
  const { payments } = paymentsReplyData || { payments: [] }

  return (
    <DefaultLayout
      className="mt-0"
      pageTitle={t('common:pageTitles.My Wallet')}
      variant="plain"
      noPanel
    >
      {data ? (
        <MyCreditsTemplate
          currentPage={page}
          onPageChange={setPage}
          totalTransfers={total}
          transfers={transfers}
          additionalPendingDeposits={payments}
        />
      ) : (
        <Loading />
      )}
    </DefaultLayout>
  )
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  const user = await getAuthenticatedUser(context)
  if (!user) {
    return handleUnauthenticatedRedirect(context.resolvedUrl)
  }
  return { props: {} }
}
