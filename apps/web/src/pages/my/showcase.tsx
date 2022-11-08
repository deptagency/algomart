import { GetServerSideProps } from 'next'
import useTranslation from 'next-translate/useTranslation'
import { useCallback, useState } from 'react'

import Loading from '@/components/loading/loading'
import { PAGE_SIZE } from '@/components/pagination/pagination'
import { useAuth } from '@/contexts/auth-context'
import { useLanguage } from '@/contexts/language-context'
import { useAddToShowcase } from '@/hooks/api/use-add-to-showcase'
import { useNFTs } from '@/hooks/api/use-nfts'
import { useRemoveFromCollectibleShowcase } from '@/hooks/api/use-remove-from-showcase'
import { useShareProfile } from '@/hooks/api/use-share-profile'
import { useShowcaseByUser } from '@/hooks/api/use-showcase-by-user'
import DefaultLayout from '@/layouts/default-layout'
import {
  getAuthenticatedUser,
  handleUnauthenticatedRedirect,
} from '@/services/api/auth-service'
import MyShowcaseTemplate from '@/templates/my-showcase-template'

export default function MyShowcasePage() {
  const { language } = useLanguage()
  const { user } = useAuth()
  const [activePage, setActivePage] = useState<number>(1)
  const { t } = useTranslation()

  const { data: { collectibles, total } = {}, isLoading: collectiblesLoading } =
    useNFTs({
      page: activePage,
      pageSize: PAGE_SIZE,
      username: user?.username,
      language,
    })

  const {
    data: { collectibles: showcaseCollectibles, showProfile } = {},
    isLoading: showcaseLoading,
  } = useShowcaseByUser(user?.username)

  const { mutate: addCollectibleToShowcase } = useAddToShowcase(user?.username)
  const { mutate: removeCollectibleFromShowcase } =
    useRemoveFromCollectibleShowcase(user?.username)
  const { mutate: setProfilePublished } = useShareProfile(user?.username)

  const addCollectible = useCallback(
    async (collectibleId: string) => addCollectibleToShowcase(collectibleId),
    [addCollectibleToShowcase]
  )

  const removeCollectible = useCallback(
    async (collectibleId: string) => {
      removeCollectibleFromShowcase(collectibleId)
    },
    [removeCollectibleFromShowcase]
  )

  const shareProfile = useCallback(
    async (shared: boolean) => {
      setProfilePublished(shared)
    },
    [setProfilePublished]
  )

  const isLoading = collectiblesLoading || showcaseLoading

  return (
    <DefaultLayout noPanel pageTitle={t('common:pageTitles.My Showcase')}>
      {isLoading ? (
        <Loading />
      ) : (
        <MyShowcaseTemplate
          addCollectible={addCollectible}
          collectibles={collectibles}
          collectiblesTotal={total}
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
