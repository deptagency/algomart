import { DEFAULT_LANG, Homepage } from '@algomart/schemas'
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
      push(urls.products.replace(':packSlug', page.featuredPack.slug))
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
    page = await ApiClient.instance.getHomepage(context.locale || DEFAULT_LANG)
  } catch {
    // ignore
  }

  return {
    // revalidate immediately if no page was loaded
    revalidate: !page ? 1 : 300,
    props: {
      page,
    },
  }
}
