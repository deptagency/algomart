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
import PublicCollectionTemplate from '@/templates/public-collection-template'
import { logger } from '@/utils/logger'
import { useApi } from '@/utils/swr'
import { urls } from '@/utils/urls'

interface PublicCollectionPageProps {
  collection: CollectionWithSets
  collectibles: CollectibleListWithTotal
}

export default function PublicCollectionPage({
  collection,
  collectibles,
}: PublicCollectionPageProps) {
  const router = useRouter()

  return (
    <DefaultLayout pageTitle={collection.name} panelPadding width="large">
      {!collectibles ? (
        <Loading />
      ) : (
        <PublicCollectionTemplate
          assets={collectibles}
          collection={collection}
          handleRedirectBrand={() => router.push(urls.releases)}
        />
      )}
    </DefaultLayout>
  )
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  // const user = await getAuthenticatedUser(context)
  // if (!user) {
  //   return handleUnauthenticatedRedirect(context.resolvedUrl)
  // }

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

  const { collectibles } = await ApiClient.instance.getPublicCollectibles({
    collectionId: collection.id,
    templateIds: collection.collectibleTemplateIds,
  })

  return {
    props: {
      collection,
      collectibles,
    },
  }
}
