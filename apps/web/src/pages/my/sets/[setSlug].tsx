import {
  CollectibleListWithTotal,
  CollectionWithSets,
  SetWithCollection,
} from '@algomart/schemas'
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
import MySetTemplate from '@/templates/my-set-template'
import { logger } from '@/utils/logger'
import { useApi } from '@/utils/swr'
import { urls } from '@/utils/urls'

interface MySetPageProps {
  set: SetWithCollection
  collection: CollectionWithSets
}

export default function MySetPage({ set, collection }: MySetPageProps) {
  const { user } = useAuth()
  const router = useRouter()

  // Fetch asset data and the set's collection
  const { data: { collectibles } = {} } = useApi<CollectibleListWithTotal>(
    user?.username
      ? `${urls.api.v1.getAssetsByOwner}?ownerUsername=${user.username}&pageSize=-1&setId=${set.id}`
      : null
  )

  return (
    <DefaultLayout pageTitle={set.name} panelPadding width="large">
      {!collectibles ? (
        <Loading />
      ) : (
        <MySetTemplate
          assets={collectibles}
          handleRedirectBrand={() => router.push(urls.releases)}
          set={set}
          collection={collection}
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

  const slug = context.params?.setSlug as string
  const set = await ApiClient.instance.getSetBySlug(slug).catch((error) => {
    logger.error(error)
    return null
  })
  if (!set) {
    return {
      notFound: true,
    }
  }

  const collection = await ApiClient.instance
    .getCollectionBySlug(set.collection.slug)
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
      set,
      collection,
    },
  }
}
