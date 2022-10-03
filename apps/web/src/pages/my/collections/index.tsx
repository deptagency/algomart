import { GetServerSideProps } from 'next'
import useTranslation from 'next-translate/useTranslation'

import Loading from '@/components/loading/loading'
import { useAuth } from '@/contexts/auth-context'
import { useLanguage } from '@/contexts/language-context'
import { useAllCollections } from '@/hooks/api/use-all-collections'
import { useNFTs } from '@/hooks/api/use-nfts'
import DefaultLayout from '@/layouts/default-layout'
import {
  getAuthenticatedUser,
  handleUnauthenticatedRedirect,
} from '@/services/api/auth-service'
import MyCollectionsTemplate from '@/templates/my-collections-template'
import { getCollectionsFromOwnedAssets } from '@/utils/collections'

export default function MyCollectionsPage() {
  const { language } = useLanguage()
  const { t } = useTranslation()
  const { user } = useAuth()

  // Fetch collections and asset data
  const { data: { collections: allCollections } = {} } = useAllCollections()

  const { data: { collectibles } = {} } = useNFTs({
    pageSize: -1,
    username: user?.username,
    language,
  })

  return (
    <DefaultLayout pageTitle={t('common:pageTitles.My Collections')} noPanel>
      {!allCollections || !collectibles ? (
        <Loading />
      ) : (
        <MyCollectionsTemplate
          assets={collectibles}
          collections={getCollectionsFromOwnedAssets(
            collectibles,
            allCollections
          )}
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
  return { props: {} }
}
