import { DEFAULT_LOCALE, Homepage } from '@algomart/schemas'
import { GetServerSidePropsContext } from 'next'
import { useRouter } from 'next/router'
import { useCallback, useEffect } from 'react'

import { ApiClient } from '@/clients/api-client'
import { useAuth } from '@/contexts/auth-context'
import DefaultLayout from '@/layouts/default-layout'
import adminService from '@/services/admin-service'
import HomeTemplate from '@/templates/home-template'
import { urls } from '@/utils/urls'

interface HomeProps {
  page: Homepage
}

export default function Home({ page }: HomeProps) {
  const { push } = useRouter()
  const auth = useAuth()

  const onClickFeatured = useCallback(() => {
    if (page.featuredPack) {
      push(urls.release.replace(':packSlug', page.featuredPack.slug))
    }
  }, [page.featuredPack, push])

  useEffect(() => {
    const findUser = async () => {
      try {
        const claims = await adminService.getLoggedInUserPermissions()
        console.log('claims:', claims)
      } catch (error) {
        console.error(error)
      }
    }
    // Check permissions on page render, after auth token is refreshed so claims are fresh
    if (auth.user) {
      findUser()
    }
  }, [auth?.user])

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
