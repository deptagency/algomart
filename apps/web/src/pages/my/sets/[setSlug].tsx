import { CollectionWithSets, SetWithCollection } from '@algomart/schemas'
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
import MySetTemplate from '@/templates/my-set-template'
import { createLogger } from '@/utils/logger'

interface MySetPageProps {
  set: SetWithCollection
  collection: CollectionWithSets
}

export default function MySetPage({ set, collection }: MySetPageProps) {
  const { language } = useLanguage()
  const { user } = useAuth()

  // Fetch asset data and the set's collection
  const { data: { collectibles } = {} } = useNFTs({
    pageSize: -1,
    setIds: [set.id],
    username: user?.username,
    language,
  })

  return (
    <DefaultLayout pageTitle={set.name} noPanel>
      {!collectibles ? (
        <Loading className="my-32" />
      ) : (
        <MySetTemplate
          assets={collectibles}
          set={set}
          collection={collection}
        />
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

  const client = new ApiClient(
    AppConfig.apiURL,
    getTokenFromCookie(context.req, context.res)
  )
  const slug = context.params?.setSlug as string
  const set = await client
    .getSetBySlug(slug, context.locale, user.externalId)
    .catch((error) => {
      logger.error(error)
      return null
    })
  if (!set) {
    return {
      notFound: true,
    }
  }

  const collection = await client
    .getCollectionBySlug(set.collection.slug, context.locale)
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
