import { CollectibleListWithTotal, CollectionWithSets } from '@algomart/schemas'
import { GetServerSideProps } from 'next'
import { useRouter } from 'next/router'

import { ApiClient } from '@/clients/api-client'
import Loading from '@/components/loading/loading'
import { useAuth } from '@/contexts/auth-context'
import DefaultLayout from '@/layouts/default-layout'
import {
  getAuthenticatedUser,
  handleUnauthenticatedRedirect,
} from '@/services/api/auth-service'
import MyCollectionTemplate from '@/templates/my-collection-template'
import { logger } from '@/utils/logger'
import { useApi } from '@/utils/swr'
import { urls } from '@/utils/urls'

interface MyCollectionPageProps {
  collection: CollectionWithSets
}

export default function MyCollectionPage({
  collection,
}: MyCollectionPageProps) {
  const { user } = useAuth()
  const router = useRouter()

  // Fetch asset data
  const { data: { collectibles } = {} } = useApi<CollectibleListWithTotal>(
    user?.username
      ? `${urls.api.v1.getAssetsByOwner}?ownerUsername=${user.username}&pageSize=-1&collectionId=${collection.id}`
      : null
  )

  return (
    <DefaultLayout pageTitle={collection.name} panelPadding width="large">
      {!collectibles ? (
        <Loading />
      ) : (
        <MyCollectionTemplate
          assets={collectibles}
          collection={collection}
          handleRedirectBrand={() => router.push(urls.releases)}
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

  const slug = context.params?.collectionSlug as string
  const collection = await ApiClient.instance
    .getCollectionBySlug(slug)
    .catch((error) => {
      logger.error(error)
      return null
    })

  if (!collection) {
    return {
      notFound: true,
    }
  }

  return {
    props: {
      collection,
    },
  }
}
