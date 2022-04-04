import { DEFAULT_LOCALE, Homepage } from '@algomart/schemas'
import { GetStaticPropsContext, GetStaticPropsResult } from 'next'
import { useRouter } from 'next/router'
import { useCallback } from 'react'

import { ApiClient } from '@/clients/api-client'
import DefaultLayout from '@/layouts/default-layout'
import HomeTemplate from '@/templates/home-template'
import { urls } from '@/utils/urls'

interface HomeProps {
  page: Homepage | null
}

export default function Home({ page }: HomeProps) {
  const { push } = useRouter()

  const onClickFeatured = useCallback(() => {
    if (page?.featuredPack) {
      push(urls.release.replace(':packSlug', page.featuredPack.slug))
    }
  }, [page?.featuredPack, push])

  return (
    <DefaultLayout noPanel>
      {page ? (
        <HomeTemplate
          onClickFeatured={onClickFeatured}
          featuredPack={page.featuredPack}
          upcomingPacks={page.upcomingPacks}
          notableCollectibles={page.notableCollectibles}
        />
      ) : null}
    </DefaultLayout>
  )
}

export async function getStaticProps(
  context: GetStaticPropsContext
): Promise<GetStaticPropsResult<HomeProps>> {
  let page: Homepage = null

  try {
    page = await ApiClient.instance.getHomepage(
      context.locale || DEFAULT_LOCALE
    )
  } catch {
    // ignore
  }

  return {
    revalidate: 300,
    props: {
      page,
    },
  }
}
