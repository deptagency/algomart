import { DEFAULT_LANG, Homepage } from '@algomart/schemas'
import { GetStaticProps } from 'next'

import { useAuth } from '@/contexts/auth-context'
import DefaultLayout from '@/layouts/default-layout'
import HomeTemplate from '@/templates/home-template'
import { apiFetcher } from '@/utils/react-query'
import { urls } from '@/utils/urls'

interface HomeProps {
  page: Homepage
}

export default function Home({ page }: HomeProps) {
  const { user } = useAuth()

  return (
    <DefaultLayout fullBleed variant="colorful">
      <HomeTemplate
        authenticated={!!user}
        featuredCollectiblesSubtitle={page?.featuredNftsSubtitle}
        featuredCollectiblesTitle={page?.featuredNftsTitle}
        featuredCollectibles={page?.featuredNfts}
        featuredFaqs={page?.featuredFaqs}
        featuredPacks={page?.featuredPacks}
        featuredPacksSubtitle={page?.featuredPacksSubtitle}
        featuredPacksTitle={page?.featuredPacksTitle}
        featuredRarities={page?.featuredRarities}
      />
    </DefaultLayout>
  )
}

export const getStaticProps: GetStaticProps<HomeProps> = async (context) => {
  const page: Homepage | null = await apiFetcher()
    .get<Homepage>(urls.api.homepage, {
      bearerToken: null,
      searchParams: {
        language: context.locale || DEFAULT_LANG,
      },
    })
    .catch((error) => {
      console.log('Error fetching homepage', error)
      return null
    })

  return {
    revalidate: 60,
    props: {
      page,
    },
  }
}
