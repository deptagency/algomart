import {
  CollectibleListWithTotal,
  CollectibleSortField,
  SortDirection,
  SortOptions,
} from '@algomart/schemas'
import { GetServerSideProps } from 'next'
import { useRouter } from 'next/router'
import useTranslation from 'next-translate/useTranslation'
import { useCallback, useState } from 'react'

import Loading from '@/components/loading/loading'
import { useAuth } from '@/contexts/auth-context'
import DefaultLayout from '@/layouts/default-layout'
import {
  getAuthenticatedUser,
  handleUnauthenticatedRedirect,
} from '@/services/api/auth-service'
import MyCollectiblesTemplate from '@/templates/my-collectibles-template'
import { getSelectSortingOptions } from '@/utils/filters'
import { useApi } from '@/utils/swr'
import { urls } from '@/utils/urls'

export default function MyCollectiblesPage() {
  const { user } = useAuth()
  const router = useRouter()
  const { t } = useTranslation()
  const [sortBy, setSortBy] = useState<CollectibleSortField>(
    CollectibleSortField.ClaimedAt
  )
  const [sortDirection, setSortDirection] = useState<SortDirection>(
    SortDirection.Descending
  )

  const [currentPage, setCurrentPage] = useState<number>(1)
  const sortOptions = getSelectSortingOptions(t)
  const [sortMode, setSortMode] = useState<string>(sortOptions[0].value)

  const { data } = useApi<CollectibleListWithTotal>(
    user?.username
      ? `${urls.api.v1.getAssetsByOwner}?ownerUsername=${user.username}&sortBy=${sortBy}&sortDirection=${sortDirection}&page=${currentPage}`
      : null
  )

  const { collectibles, total } = data || {}

  const handlePageChange = useCallback((pageNumber: number) => {
    setCurrentPage(pageNumber)
  }, [])

  const handleSortChange = useCallback((value: string) => {
    setCurrentPage(1)
    setSortMode(value)
    const [newSortBy, newSortDirection] = {
      [SortOptions.Newest]: [
        CollectibleSortField.ClaimedAt,
        SortDirection.Descending,
      ],
      [SortOptions.Oldest]: [
        CollectibleSortField.ClaimedAt,
        SortDirection.Ascending,
      ],
      [SortOptions.Name]: [CollectibleSortField.Title, SortDirection.Ascending],
    }[value] as [CollectibleSortField, SortDirection]
    setSortBy(newSortBy)
    setSortDirection(newSortDirection)
  }, [])

  return (
    <DefaultLayout
      pageTitle={t('common:pageTitles.My Collectibles')}
      panelPadding
      width="large"
    >
      {!collectibles || total === undefined ? (
        <Loading />
      ) : (
        <MyCollectiblesTemplate
          assets={collectibles}
          currentPage={currentPage}
          onPageChange={handlePageChange}
          onRedirectBrands={() => router.push(urls.browse)}
          onSortChange={handleSortChange}
          sortMode={sortMode}
          sortOptions={sortOptions}
          totalCollectibles={total}
        />
      )}
    </DefaultLayout>
  )
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  const user = await getAuthenticatedUser(context)
  if (!user) {
    return handleUnauthenticatedRedirect(context.resolvedUrl)
  }

  return {
    props: {},
  }
}
