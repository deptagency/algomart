import { CollectionWithSets } from '@algomart/schemas'
import { GetServerSideProps } from 'next'

import { ApiClient } from '@/clients/api-client'
import Loading from '@/components/loading/loading'
import { AppConfig } from '@/config'
import { useAuth } from '@/contexts/auth-context'
import { useLanguage } from '@/contexts/language-context'
import { useNFTs } from '@/hooks/api/use-nfts'
import DefaultLayout from '@/layouts/default-layout'
import {
  getAuthenticatedUser,
  getTokenFromCookie,
  handleUnauthenticatedRedirect,
} from '@/services/api/auth-service'
import MyCollectionTemplate from '@/templates/my-collection-template'
import { createLogger } from '@/utils/logger'

interface MyCollectionPageProps {
  collection: CollectionWithSets
}

export default function MyCollectionPage({
  collection,
}: MyCollectionPageProps) {
  const { language } = useLanguage()
  const { user } = useAuth()

  // Fetch asset data
  const { data: { collectibles } = {} } = useNFTs({
    pageSize: -1,
    collectionIds: [collection.id],
    username: user?.username,
    language,
  })

  return (
    <DefaultLayout pageTitle={collection.name} noPanel>
      {!collectibles ? (
        <Loading />
      ) : (
        <MyCollectionTemplate assets={collectibles} collection={collection} />
      )}
    </DefaultLayout>
  )
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  const user = await getAuthenticatedUser(context)
  const logger = createLogger(AppConfig.logLevel)

  if (!user) {
    return handleUnauthenticatedRedirect(context.resolvedUrl)
  }

  const slug = context.params?.collectionSlug as string
  const client = new ApiClient(
    AppConfig.apiURL,
    getTokenFromCookie(context.req, context.res)
  )
  const collection = await client
    .getCollectionBySlug(slug, context.locale)
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
