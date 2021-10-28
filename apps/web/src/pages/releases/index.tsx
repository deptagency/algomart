import { DEFAULT_LOCALE, PackType, PublishedPacks } from '@algomart/schemas'
import { GetServerSideProps } from 'next'
import useTranslation from 'next-translate/useTranslation'
import { useEffect, useMemo, useRef } from 'react'

import { ApiClient } from '@/clients/api-client'
import { PackFilterProvider } from '@/contexts/pack-filter-context'
import { useLocale } from '@/hooks/useLocale'
import { usePackFilter } from '@/hooks/usePackFilter'
import DefaultLayout from '@/layouts/default-layout'
import ReleasesTemplate from '@/templates/releases-template'
import {
  getPublishedPacksFilterQuery,
  getPublishedPacksFilterQueryFromState,
} from '@/utils/filters'
import { useApi } from '@/utils/swr'
import { urls } from '@/utils/urls'

export const RELEASES_PER_PAGE = 9

export default function Releases({ packs }: PublishedPacks) {
  const { t } = useTranslation()
  const locale = useLocale()
  const { dispatch, state } = usePackFilter()
  const pageTop = useRef<HTMLDivElement | null>(null)

  const queryString = useMemo(() => {
    const query = getPublishedPacksFilterQueryFromState(locale, state)
    query.pageSize = RELEASES_PER_PAGE
    return getPublishedPacksFilterQuery(query)
  }, [locale, state])

  const { data, isValidating } = useApi<PublishedPacks>(
    `${urls.api.v1.getPublishedPacks}?${queryString}`
  )

  useEffect(() => {
    if (!isValidating && pageTop.current) {
      pageTop.current.scrollIntoView({ behavior: 'smooth' })
    }
  }, [isValidating, state.currentPage])

  return (
    <DefaultLayout pageTitle={t('common:pageTitles.Releases')} width="full">
      <div ref={pageTop} />
      <PackFilterProvider value={{ dispatch, state }}>
        <ReleasesTemplate
          isLoading={isValidating}
          packs={data?.packs || packs}
          total={data?.total || 0}
        />
      </PackFilterProvider>
    </DefaultLayout>
  )
}

export const getServerSideProps: GetServerSideProps<PublishedPacks> = async ({
  locale,
}) => {
  const { packs, total } = await ApiClient.instance.getPublishedPacks({
    locale: locale || DEFAULT_LOCALE,
    page: 1,
    pageSize: RELEASES_PER_PAGE,
    type: [PackType.Auction, PackType.Purchase],
  })
  return { props: { packs, total } }
}
