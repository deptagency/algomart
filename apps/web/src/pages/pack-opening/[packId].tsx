import { PackWithCollectibles } from '@algomart/schemas'
import { GetServerSideProps } from 'next'
import useTranslation from 'next-translate/useTranslation'

import { ApiClient } from '@/clients/api-client'
import { AppConfig } from '@/config'
import { PackOpeningProvider } from '@/contexts/pack-opening-context'
import DefaultLayout from '@/layouts/default-layout'
import {
  getAuthenticatedUser,
  getTokenFromCookie,
  handleUnauthenticatedRedirect,
} from '@/services/api/auth-service'
import PackOpeningTemplate from '@/templates/pack-opening-template'
import { urls } from '@/utils/urls'

interface PackOpeningPageProps {
  pack: PackWithCollectibles
}

export default function PackOpeningPage({ pack }: PackOpeningPageProps) {
  const { t } = useTranslation()
  return (
    <DefaultLayout
      fullBleed
      pageTitle={t('common:pageTitles.Pack Opening', { name: pack.title })}
    >
      <PackOpeningProvider pack={pack}>
        <PackOpeningTemplate />
      </PackOpeningProvider>
    </DefaultLayout>
  )
}

export const getServerSideProps: GetServerSideProps<
  PackOpeningPageProps
> = async (context) => {
  // Verify authentication
  const user = await getAuthenticatedUser(context)
  if (!user) return handleUnauthenticatedRedirect(context.resolvedUrl)

  // Get pack opening data
  const packId = context?.params?.packId as string
  if (!packId)
    return {
      redirect: {
        destination: urls.myCollectibles,
        permanent: false,
      },
    }

  const client = new ApiClient(
    AppConfig.apiURL,
    getTokenFromCookie(context.req, context.res)
  )
  const pack = await client.packWithCollectibles({
    packId,
    language: context?.locale,
  })

  if (!pack)
    return {
      notFound: true,
    }

  return {
    props: {
      pack,
    },
  }
}
