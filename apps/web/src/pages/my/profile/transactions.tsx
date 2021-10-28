import {
  PacksByOwner,
  PackSortByOwnerField,
  SortDirection,
} from '@algomart/schemas'
import { GetServerSideProps } from 'next'
import useTranslation from 'next-translate/useTranslation'
import { useCallback, useState } from 'react'

import { ApiClient } from '@/clients/api-client'
import MyProfileLayout from '@/layouts/my-profile-layout'
import {
  getAuthenticatedUser,
  handleUnauthenticatedRedirect,
} from '@/services/api/auth-service'
import MyProfileTransactionsTemplate from '@/templates/my-profile-transactions-template'

export interface MyProfileTransactionsPageProps {
  releaseDetails: PacksByOwner
}

export default function MyProfileTransactionsPage({
  releaseDetails,
}: MyProfileTransactionsPageProps) {
  const { t } = useTranslation()
  const [currentPage, setCurrentPage] = useState<number>(1)
  const pageSize = 6

  const handlePageChange = useCallback((pageNumber: number) => {
    setCurrentPage(pageNumber)
  }, [])

  return (
    <MyProfileLayout pageTitle={t('common:pageTitles.Transactions')}>
      <MyProfileTransactionsTemplate
        currentPage={currentPage}
        handlePageChange={handlePageChange}
        pageSize={pageSize}
        releases={releaseDetails?.packs}
        total={releaseDetails?.total}
      />
    </MyProfileLayout>
  )
}

export const getServerSideProps: GetServerSideProps<MyProfileTransactionsPageProps> =
  async (context) => {
    // Verify authentication
    const user = await getAuthenticatedUser(context)
    if (!user) {
      return handleUnauthenticatedRedirect(context.resolvedUrl)
    }

    const { packs, total } = await ApiClient.instance.getPacksByOwnerId(
      user.externalId,
      {
        locale: context.locale,
        sortBy: PackSortByOwnerField.ClaimedAt,
        sortDirection: SortDirection.Descending,
      }
    )

    return {
      props: {
        releaseDetails: {
          packs: packs ?? [],
          total: total ?? 0,
        },
      },
    }
  }
