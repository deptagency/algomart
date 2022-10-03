import {
  CollectibleSortField,
  SortDirection,
  SortOptions,
} from '@algomart/schemas'
import { GetServerSideProps } from 'next'
import useTranslation from 'next-translate/useTranslation'
import { useCallback, useState } from 'react'

import Loading from '@/components/loading/loading'
import { useAuth } from '@/contexts/auth-context'
import { useLanguage } from '@/contexts/language-context'
import { useNFTs } from '@/hooks/api/use-nfts'
import DefaultLayout from '@/layouts/default-layout'
import {
  getAuthenticatedUser,
  handleUnauthenticatedRedirect,
} from '@/services/api/auth-service'
import MyCollectiblesTemplate from '@/templates/my-collectibles-template'
import { getSortOptions } from '@/utils/filters'

export default function MyCollectiblesPage() {
  const { t } = useTranslation()
  const [sortBy, setSortBy] = useState<CollectibleSortField>(
    CollectibleSortField.ClaimedAt
  )
  const [sortDirection, setSortDirection] = useState<SortDirection>(
    SortDirection.Descending
  )

  const { language } = useLanguage()
  const { user } = useAuth()
  const [currentPage, setCurrentPage] = useState<number>(1)
  const sortOptions = getSortOptions(t)
  const [sortMode, setSortMode] = useState<string>(sortOptions[0].value)

  const { data } = useNFTs({
    sortBy,
    sortDirection,
    language,
    page: currentPage,
    username: user?.username,
  })

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
      [SortOptions.RarityAscending]: [
        CollectibleSortField.Rarity,
        SortDirection.Ascending,
      ],
      [SortOptions.RarityDescending]: [
        CollectibleSortField.Rarity,
        SortDirection.Descending,
      ],
    }[value] as [CollectibleSortField, SortDirection]
    setSortBy(newSortBy)
    setSortDirection(newSortDirection)
  }, [])

  return (
    <DefaultLayout pageTitle={t('common:pageTitles.My Collectibles')} noPanel>
      {!collectibles || total === undefined ? (
        <Loading />
      ) : (
        <MyCollectiblesTemplate
          assets={collectibles}
          currentPage={currentPage}
          onPageChange={handlePageChange}
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
