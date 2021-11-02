import {
  CollectibleListShowcase,
  CollectibleListWithTotal,
} from '@algomart/schemas'
import { GetServerSideProps } from 'next'
import { useRouter } from 'next/router'
import useTranslation from 'next-translate/useTranslation'
import { useCallback, useState } from 'react'

import Loading from '@/components/loading/loading'
import { PAGE_SIZE } from '@/components/pagination/pagination'
import { useAuth } from '@/contexts/auth-context'
import DefaultLayout from '@/layouts/default-layout'
import {
  getAuthenticatedUser,
  handleUnauthenticatedRedirect,
} from '@/services/api/auth-service'
import collectibleService from '@/services/collectible-service'
import MyShowcaseTemplate from '@/templates/my-showcase-template'
import { useApi, useAuthApi } from '@/utils/swr'
import { urls } from '@/utils/urls'

export default function MyShowcasePage() {
  const { user } = useAuth()
  const router = useRouter()
  const [activePage, setActivePage] = useState<number>(1)
  const { t } = useTranslation()

  // Fetch asset data
  const { data: { collectibles, total } = {} } =
    useApi<CollectibleListWithTotal>(
      user?.username
        ? `${urls.api.v1.getAssetsByOwner}?ownerUsername=${user.username}&page=${activePage}&pageSize=${PAGE_SIZE}`
        : null
    )

  const {
    data: { collectibles: showcaseCollectibles, showProfile } = {},
    mutate,
  } = useAuthApi<CollectibleListShowcase>(
    user?.username
      ? `${urls.api.v1.showcaseCollectible}?ownerUsername=${user.username}`
      : null
  )

  const isLoading =
    collectibles === undefined ||
    total === undefined ||
    showcaseCollectibles === undefined ||
    showProfile === undefined

  const addCollectible = useCallback(
    async (collectibleId: string) => {
      // Add asset/collectible to publicCollectibles list for customer
      await collectibleService.addCollectibleShowcase(collectibleId)
      if (collectibles) {
        const collectible = collectibles.find((c) => c.id === collectibleId)
        if (collectible) {
          mutate({
            collectibles: [...(showcaseCollectibles || []), collectible],
            showProfile: !!showProfile,
          })
        }
      }
    },
    [collectibles, mutate, showProfile, showcaseCollectibles]
  )

  const removeCollectible = useCallback(
    async (collectibleId: string) => {
      // Remove asset/collectible to publicCollectibles list for customer
      await collectibleService.removeCollectibleShowcase(collectibleId)
      if (collectibles) {
        mutate({
          collectibles: (showcaseCollectibles || []).filter(
            (c) => c.id !== collectibleId
          ),
          showProfile: !!showProfile,
        })
      }
    },
    [collectibles, mutate, showProfile, showcaseCollectibles]
  )

  const shareProfile = useCallback(
    async (shared: boolean) => {
      await collectibleService.shareProfile(shared)
      mutate({
        collectibles: showcaseCollectibles || [],
        showProfile: shared,
      })
    },
    [mutate, showcaseCollectibles]
  )

  return (
    <DefaultLayout pageTitle={t('common:pageTitles.My Showcase')} width="large">
      {isLoading ? (
        <Loading />
      ) : (
        <MyShowcaseTemplate
          addCollectible={addCollectible}
          collectibles={collectibles}
          collectiblesTotal={total}
          handleRedirectBrands={() => router.push(urls.releases)}
          page={activePage}
          pageSize={PAGE_SIZE}
          showcaseCollectibles={showcaseCollectibles}
          removeCollectible={removeCollectible}
          setPage={setActivePage}
          setShareProfile={shareProfile}
          shareProfile={showProfile}
        />
      )}
    </DefaultLayout>
  )
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  const user = await getAuthenticatedUser(context)
  if (!user) {
    return handleUnauthenticatedRedirect(context.resolvedUrl)
  }

  return {
    props: {},
  }
}
