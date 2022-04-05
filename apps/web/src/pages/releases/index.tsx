import { DEFAULT_LANG, PackType, PublishedPacks } from '@algomart/schemas'
import { GetServerSideProps } from 'next'
import { useRouter } from 'next/router'
import useTranslation from 'next-translate/useTranslation'
import { parse, stringify } from 'query-string'
import { useEffect, useMemo, useRef } from 'react'

import { ApiClient } from '@/clients/api-client'
import { PackFilterProvider } from '@/contexts/pack-filter-context'
import { useCurrency } from '@/hooks/use-currency'
import { useLanguage } from '@/hooks/use-language'
import { usePackFilter } from '@/hooks/use-pack-filter'
import DefaultLayout from '@/layouts/default-layout'
import ReleasesTemplate from '@/templates/releases-template'
import { getSelectSortingOptions } from '@/utils/filters'
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
  const searchParams = stringify(query)
  // ...so they can be processed by query-string
  const initialState = parse(searchParams, {
    parseBooleans: true,
    parseNumbers: true,
  })

  // selectedOption is an object, so key off its id so it can live in URL
  const initialSelectOptions = getSelectSortingOptions(t)
  const selectedOption = getSelectSortingOptions(t).find(
    (option) => option.id === initialState.selectedOption
  )

  // Set initial filter state based off of URL parsing
  const { dispatch, state } = usePackFilter({
    ...initialState,
    selectedOption: selectedOption ? selectedOption : initialSelectOptions[0],
  })

  const pageTop = useRef<HTMLDivElement | null>(null)

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

  useEffect(() => {
    if (!isValidating && pageTop.current) {
      pageTop.current.scrollIntoView({ behavior: 'smooth' })
    }
  }, [isValidating, state.currentPage])

  // If state changes, update the URL
  useEffect(() => {
    const previousState = stringify(parse(location.search))
    const nextState = stringify(state)
    if (previousState !== nextState) {
      const { selectedOption, selectOptions, ...rest } = state
      push({
        pathname: pathname,
        query: { ...rest, selectedOption: selectedOption.id },
      })
    }
  }, [pathname, state]) // eslint-disable-line react-hooks/exhaustive-deps

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
  const { packs, total } = await ApiClient.instance.searchPublishedPacks({
    language: locale || DEFAULT_LANG,
    page: 1,
    pageSize: RELEASES_PER_PAGE,
    type: [PackType.Auction, PackType.Purchase],
  })
  return { props: { packs, total } }
}
