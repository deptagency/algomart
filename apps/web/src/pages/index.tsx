import { DEFAULT_LOCALE, Homepage } from '@algomart/schemas'
import { GetServerSidePropsContext } from 'next'
import { useRouter } from 'next/router'
import { useCallback } from 'react'

import { ApiClient } from '@/clients/api-client'
import DefaultLayout from '@/layouts/default-layout'
import HomeTemplate from '@/templates/home-template'
import { urls } from '@/utils/urls'

interface HomeProps {
  page: Homepage
}

export default function Home({ page }: HomeProps) {
  const { push } = useRouter()

  const onClickFeatured = useCallback(() => {
    if (page.featuredPack) {
      push(urls.release.replace(':packSlug', page.featuredPack.slug))
    }
  }, [page.featuredPack, push])

  return (
    <DefaultLayout noPanel>
      <HomeTemplate
        onClickFeatured={onClickFeatured}
        featuredPack={page.featuredPack}
        upcomingPacks={page.upcomingPacks}
        notableCollectibles={page.notableCollectibles}
      />
    </DefaultLayout>
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
