import { DEFAULT_LANG, PackType, PublishedPacks } from '@algomart/schemas'
import { GetServerSideProps } from 'next'
import { useRouter } from 'next/router'
import useTranslation from 'next-translate/useTranslation'
import { parse, stringify } from 'query-string'
import { useEffect, useMemo } from 'react'

import { ApiClient } from '@/clients/api-client'
import { PackFilterProvider } from '@/contexts/pack-filter-context'
import { useCurrency } from '@/hooks/use-currency'
import { useLanguage } from '@/hooks/use-language'
import { usePackFilter } from '@/hooks/use-pack-filter'
import DefaultLayout from '@/layouts/default-layout'
import ReleasesTemplate from '@/templates/releases-template'
import {
  getPublishedPacksFilterQueryFromState,
  searchPublishedPacksFilterQuery,
} from '@/utils/filters'
import { useApi } from '@/utils/swr'
import { urls } from '@/utils/urls'

export const RELEASES_PER_PAGE = 9

export default function Releases({ packs }: PublishedPacks) {
  const { t } = useTranslation()
  const language = useLanguage()
  const currency = useCurrency()
  const { pathname, push, query } = useRouter()

  // Get URL search params from router, stringify them...
  const searchParams = useMemo(() => stringify(query), [query])
  // ...so they can be processed by query-string
  const initialState = useMemo(
    () =>
      parse(searchParams, {
        parseBooleans: true,
        parseNumbers: true,
      }),
    [searchParams]
  )

  // Set initial filter state based off of URL parsing
  const { dispatch, state } = usePackFilter(initialState)

  const queryString = useMemo(() => {
    const query = getPublishedPacksFilterQueryFromState(
      language,
      state,
      currency
    )
    query.pageSize = RELEASES_PER_PAGE
    return searchPublishedPacksFilterQuery(query)
  }, [language, state, currency])

  const { data, isValidating } = useApi<PublishedPacks>(
    `${urls.api.v1.getPublishedPacks}?${queryString}`
  )

  // If state changes, update the URL
  useEffect(() => {
    const previousState = stringify(parse(location.search))
    const nextState = stringify(state as any)
    if (previousState !== nextState) {
      const { selectOptions, ...rest } = state
      push(
        {
          pathname: pathname,
          query: { ...rest },
        },
        undefined,
        { scroll: false }
      )
    }
  }, [pathname, state]) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <DefaultLayout pageTitle={t('common:pageTitles.Releases')} width="full">
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
  const { packs, total } = await ApiClient.instance.searchPublishedPacks({
    language: locale || DEFAULT_LANG,
    page: 1,
    pageSize: RELEASES_PER_PAGE,
    type: [PackType.Auction, PackType.Purchase],
  })
  return { props: { packs, total } }
}
