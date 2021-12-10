import {
  CollectibleListWithTotal,
  CollectibleSortField,
  CollectibleWithDetails,
  SortDirection,
  SortOptions,
} from '@algomart/schemas'
import { GetServerSideProps } from 'next'
import useTranslation from 'next-translate/useTranslation'
import { useCallback, useState } from 'react'

import Loading from '@/components/loading/loading'
import { PAGE_SIZE } from '@/components/pagination/pagination'
import { SelectOption } from '@/components/select/select'
import DefaultLayout from '@/layouts/default-layout'
import AlgoAddressTemplate from '@/templates/algo-address-template'
import { getSelectSortingOptions } from '@/utils/filters'
import { useApi } from '@/utils/swr'
import { urls } from '@/utils/urls'

interface AlgoAddressPageProps {
  algoAddress: string
}

export default function AlgoAddressPage({ algoAddress }: AlgoAddressPageProps) {
  const { t } = useTranslation()

  const [activeAsset, setActiveAsset] = useState<CollectibleWithDetails | null>(
    null
  )
  const [currentPage, setCurrentPage] = useState<number>(1)
  const [isViewerActive, setIsViewerActive] = useState<boolean>(false)
  const selectOptions = getSelectSortingOptions(t)
  const [selectedOption, setSelectedOption] = useState<SelectOption>(
    selectOptions[0]
  )
  const [sortBy, setSortBy] = useState<CollectibleSortField>(
    CollectibleSortField.ClaimedAt
  )
  const [sortDirection, setSortDirection] = useState<SortDirection>(
    SortDirection.Descending
  )

  const { data, error } = useApi<CollectibleListWithTotal>(
    `${urls.api.v1.getAssetsByAlgoAddress}?algoAddress=${algoAddress}&sortBy=${sortBy}&sortDirection=${sortDirection}&page=${currentPage}&pageSize=${PAGE_SIZE}`
  )

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
      pageTitle={t('common:pageTitles.Algorand Address', { algoAddress })}
      panelPadding
      width="large"
    >
      {!error && !data ? (
        <Loading />
      ) : (
        <AlgoAddressTemplate
          algoAddress={algoAddress}
          algoAddressIsInvalid={!!error}
          activeAsset={activeAsset}
          assets={data?.collectibles || []}
          currentPage={currentPage}
          handlePageChange={handlePageChange}
          handleSortChange={handleSortChange}
          isViewerActive={isViewerActive}
          selectedOption={selectedOption}
          selectOptions={selectOptions}
          totalCollectibles={data?.total || 0}
          toggleViewer={toggleViewer}
        />
      )}
    </DefaultLayout>
  )
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  const algoAddress = context.params?.algoAddress as string

  // Algorand addresses are exactly 58 characters
  if (algoAddress.length !== 58) {
    return {
      notFound: true,
    }
  }

  return {
    props: {
      algoAddress: context.params?.algoAddress as string,
    },
  }
}
