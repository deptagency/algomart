import {
  CollectibleListWithTotal,
  CollectibleSortField,
  CollectibleWithDetails,
  SortDirection,
  SortOptions,
} from '@algomart/schemas'
import { GetServerSideProps } from 'next'
import { useRouter } from 'next/router'
import useTranslation from 'next-translate/useTranslation'
import { useCallback, useState } from 'react'

import Loading from '@/components/loading/loading'
import { SelectOption } from '@/components/select/select'
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

  const [activeAsset, setActiveAsset] = useState<CollectibleWithDetails | null>(
    null
  )
  const [currentPage, setCurrentPage] = useState<number>(1)
  const [isViewerActive, setIsViewerActive] = useState<boolean>(false)

  const selectOptions = getSelectSortingOptions(t)
  const [selectedOption, setSelectedOption] = useState<SelectOption>(
    selectOptions[0]
  )

  const { data } = useApi<CollectibleListWithTotal>(
    user?.username
      ? `${urls.api.v1.getAssetsByOwner}?ownerUsername=${user.username}&sortBy=${sortBy}&sortDirection=${sortDirection}&page=${currentPage}`
      : null
  )

  const { collectibles, total } = data || {}

  const handlePageChange = useCallback((pageNumber: number) => {
    setCurrentPage(pageNumber)
  }, [])

  const handleSortChange = useCallback((option: SelectOption) => {
    setCurrentPage(1)
    setSelectedOption(option)
    let newSortBy = CollectibleSortField.Title
    let newSortDirection = SortDirection.Ascending

    switch (option.id) {
      case SortOptions.Newest:
        newSortBy = CollectibleSortField.ClaimedAt
        newSortDirection = SortDirection.Descending
        break
      case SortOptions.Oldest:
        newSortBy = CollectibleSortField.ClaimedAt
        newSortDirection = SortDirection.Ascending
        break
      case SortOptions.Name:
        newSortBy = CollectibleSortField.Title
        newSortDirection = SortDirection.Ascending
        break
    }

    setSortBy(newSortBy)
    setSortDirection(newSortDirection)
  }, [])

  const toggleViewer = useCallback((asset?: CollectibleWithDetails) => {
    if (asset) {
      setIsViewerActive(true)
      setActiveAsset(asset)
    } else {
      setActiveAsset(null)
      setIsViewerActive(false)
    }
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
          activeAsset={activeAsset}
          assets={collectibles}
          currentPage={currentPage}
          handlePageChange={handlePageChange}
          handleRedirectBrands={() => router.push(urls.releases)}
          handleSortChange={handleSortChange}
          isViewerActive={isViewerActive}
          selectedOption={selectedOption}
          selectOptions={selectOptions}
          totalCollectibles={total}
          toggleViewer={toggleViewer}
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
