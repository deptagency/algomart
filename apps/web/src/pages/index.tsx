import { DEFAULT_LOCALE, Homepage } from '@algomart/schemas'
import { GetServerSidePropsContext } from 'next'
import { useRouter } from 'next/router'
import { useCallback } from 'react'

import { ApiClient } from '@/clients/api-client'
import FullBleedLayout from '@/layouts/full-bleed-layout'
import HomeTemplate from '@/templates/home-template'
import { urls } from '@/utils/urls'

interface HomeProps {
  page: Homepage
}

export default function Home({ page }: HomeProps) {
  const { push } = useRouter()

  const onClickFeatured = useCallback(() => {
    if (page.heroPack) {
      push(urls.release.replace(':packSlug', page.heroPack.slug))
    }
  }, [page.heroPack, push])

  return (
    <FullBleedLayout>
      <HomeTemplate
        featuredCollectibles={page.featuredNfts}
        featuredPacks={page.featuredPacks}
        heroBanner={page.heroBanner}
        heroBannerSubtitle={page.heroBannerSubtitle}
        heroBannerTitle={page.heroBannerTitle}
        heroPack={page.heroPack}
        onClickFeatured={onClickFeatured}
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
