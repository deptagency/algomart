import { CollectibleListWithTotal, CollectionWithSets } from '@algomart/schemas'
import { GetServerSideProps } from 'next'
import { useRouter } from 'next/router'
import useTranslation from 'next-translate/useTranslation'

import Loading from '@/components/loading/loading'
import { useAuth } from '@/contexts/auth-context'
import DefaultLayout from '@/layouts/default-layout'
import {
  getAuthenticatedUser,
  handleUnauthenticatedRedirect,
} from '@/services/api/auth-service'
import MyCollectionsTemplate from '@/templates/my-collections-template'
import { getCollectionsFromOwnedAssets } from '@/utils/collections'
import { useApi } from '@/utils/swr'
import { urls } from '@/utils/urls'

export default function MyCollectionsPage() {
  const { user } = useAuth()
  const router = useRouter()
  const { t } = useTranslation()

  // Fetch collections and asset data
  const { data: { collections: allCollections } = {} } = useApi<{
    total: number
    collections: CollectionWithSets[]
  }>(urls.api.v1.getAllCollections)
  const { data: { collectibles } = {} } = useApi<CollectibleListWithTotal>(
    user?.username
      ? `${urls.api.v1.getAssetsByOwner}?ownerUsername=${user.username}&pageSize=-1`
      : null
  )

  return (
    <DefaultLayout
      pageTitle={t('common:pageTitles.My Collections')}
      panelPadding
      width="large"
    >
      {!allCollections || !collectibles ? (
        <Loading />
      ) : (
        <MyCollectionsTemplate
          assets={collectibles}
          collections={getCollectionsFromOwnedAssets(
            collectibles,
            allCollections
          )}
          handleRedirectBrands={() => router.push(urls.releases)}
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
