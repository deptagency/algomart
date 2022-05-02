import {
  DEFAULT_LANG,
  PackType,
  Products,
  ProductType,
} from '@algomart/schemas'
import { GetServerSideProps } from 'next'
import { useRouter } from 'next/router'
import useTranslation from 'next-translate/useTranslation'
import { parse, stringify } from 'query-string'
import { useEffect, useMemo } from 'react'

import { ApiClient } from '@/clients/api-client'
import { ProductFilterProvider } from '@/contexts/product-filter-context'
import { useCurrency } from '@/hooks/use-currency'
import { useLanguage } from '@/hooks/use-language'
import { useProductFilter } from '@/hooks/use-product-filter'
import DefaultLayout from '@/layouts/default-layout'
import ProductsTemplate from '@/templates/products-template'
import {
  getProductFilterQueryFromState,
  searchProductsFilterQuery,
} from '@/utils/filters'
import { useApi } from '@/utils/swr'
import { urls } from '@/utils/urls'

export const PRODUCTS_PER_PAGE = 9

export default function Browse({ products }: Products) {
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
  const { dispatch, state } = useProductFilter(initialState)

  const queryString = useMemo(() => {
    const query = getProductFilterQueryFromState(language, state, currency)
    query.pageSize = PRODUCTS_PER_PAGE
    return searchProductsFilterQuery(query)
  }, [language, state, currency])

  const { data, isValidating } = useApi<Products>(
    `${urls.api.v1.searchProducts}?${queryString}`
  )

  // If state changes, update the URL
  useEffect(() => {
    const previousState = stringify(parse(location.search))
    const { selectOptions, ...rest } = state
    const nextState = stringify(rest)
    if (previousState !== nextState) {
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
      <ProductFilterProvider value={{ dispatch, state }}>
        <ProductsTemplate
          isLoading={isValidating}
          products={data?.products || products}
          total={data?.total || 0}
        />
      </ProductFilterProvider>
    </DefaultLayout>
  )
}

export const getServerSideProps: GetServerSideProps<Products> = async ({
  locale,
}) => {
  const { products, total } = await ApiClient.instance.searchProducts({
    language: locale || DEFAULT_LANG,
    page: 1,
    pageSize: PRODUCTS_PER_PAGE,
    type: [ProductType.Auction, ProductType.Purchase],
  })
  return { props: { products, total } }
}
