import { Brand, PublishedPacks } from '@algomart/schemas'
import { GetServerSideProps } from 'next'
import Image from 'next/image'
import { useEffect, useMemo, useRef } from 'react'

import { ApiClient } from '@/clients/api-client'
import { PackFilterProvider } from '@/contexts/pack-filter-context'
import { useLocale } from '@/hooks/use-locale'
import { usePackFilter } from '@/hooks/use-pack-filter'
import DefaultLayout from '@/layouts/default-layout'
import ReleasesTemplate from '@/templates/releases-template'
import { cmsImageLoader } from '@/utils/cms-image-loader'
import {
  getPublishedPacksFilterQuery,
  getPublishedPacksFilterQueryFromState,
} from '@/utils/filters'
import { useApi } from '@/utils/swr'
import { urls } from '@/utils/urls'

export const RELEASES_PER_PAGE = 9

interface BrandPageProps {
  brand: Brand
}

export default function BrandPage({ brand }: BrandPageProps) {
  const locale = useLocale()
  const { dispatch, state } = usePackFilter({ brandId: brand.id })
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
    <DefaultLayout noPanel pageTitle={brand.name}>
      {brand.banner && (
        <Image
          loader={cmsImageLoader}
          src={brand.banner}
          alt={brand.name}
          width={1000}
          height={300}
          objectFit="cover"
          layout="responsive"
        />
      )}
      <div ref={pageTop} className="mt-4" />
      <PackFilterProvider value={{ dispatch, state }}>
        <ReleasesTemplate
          isLoading={isValidating}
          packs={data?.packs || []}
          total={data?.total || 0}
        />
      </PackFilterProvider>
    </DefaultLayout>
  )
}

export const getServerSideProps: GetServerSideProps<BrandPageProps> = async (
  context
) => {
  const brand = await ApiClient.instance.getBrand(
    context?.params?.brandSlug as string
  )

  return {
    props: {
      brand,
    },
  }
}
