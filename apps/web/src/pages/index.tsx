import { DEFAULT_LOCALE, Homepage } from '@algomart/schemas'
import { GetServerSidePropsContext } from 'next'
import { useRouter } from 'next/router'
import { useCallback } from 'react'

import { ApiClient } from '@/clients/api-client'
import { useAuth } from '@/contexts/auth-context'
import FullBleedLayout from '@/layouts/full-bleed-layout'
import HomeTemplate from '@/templates/home-template'
import { urls } from '@/utils/urls'

interface HomeProps {
  page: Homepage
}

export default function Home({ page }: HomeProps) {
  const { user } = useAuth()
  const { push } = useRouter()

  const onClickFeatured = useCallback(() => {
    push(urls.release.replace(':packSlug', page.heroPack.slug))
  }, [page.heroPack, push])

  const onClickReleases = useCallback(() => {
    push(urls.releases)
  }, [push])

  return (
    <FullBleedLayout>
      <HomeTemplate
        authenticated={!!user}
        featuredCollectiblesSubtitle={page.featuredNftsSubtitle}
        featuredCollectiblesTitle={page.featuredNftsTitle}
        featuredCollectibles={page.featuredNfts}
        featuredPacks={page.featuredPacks}
        featuredPacksSubtitle={page.featuredPacksSubtitle}
        featuredPacksTitle={page.featuredPacksTitle}
        heroBanner={page.heroBanner}
        heroBannerSubtitle={page.heroBannerSubtitle}
        heroBannerTitle={page.heroBannerTitle}
        heroPack={page.heroPack}
        onClickFeatured={onClickFeatured}
        onClickReleases={onClickReleases}
      />
    </FullBleedLayout>
  )
}

export async function getServerSideProps(context: GetServerSidePropsContext) {
  return {
    props: {
      page: await ApiClient.instance.getHomepage(
        context.locale || DEFAULT_LOCALE
      ),
    },
  }
}
