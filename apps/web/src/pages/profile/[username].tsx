import { CollectiblesShowcase, CollectibleWithDetails } from '@algomart/schemas'
import { GetServerSidePropsContext } from 'next'
import useTranslation from 'next-translate/useTranslation'

import DefaultLayout from '@/layouts/default-layout'
import ProfileUsernameTemplate from '@/templates/profile-username-template'
import { apiFetcher } from '@/utils/react-query'
import { urlFor, urls } from '@/utils/urls'

export interface PublicProfilePageProps {
  collectibles: CollectibleWithDetails[]
  username: string
}

export default function PublicProfilePage({
  collectibles,
  username,
}: PublicProfilePageProps) {
  const { t } = useTranslation()
  return (
    <DefaultLayout
      fullBleed
      pageTitle={t('common:pageTitles.User Profile', { name: username })}
      variant="colorful"
    >
      {username ? (
        <ProfileUsernameTemplate
          username={username}
          collectibles={collectibles}
        />
      ) : null}
    </DefaultLayout>
  )
}

export async function getServerSideProps(context: GetServerSidePropsContext) {
  let username = ''
  let collectibles = []
  try {
    username = context.params?.username as string
    const result = await apiFetcher().get<CollectiblesShowcase | null>(
      urlFor(urls.api.collectibles.fetchShowcase, null, {
        ownerUsername: username,
      }),
      {
        bearerToken: null,
      }
    )
    if (result?.showProfile) {
      collectibles = result?.collectibles || []
    }
  } catch {
    // ignore
  }

  return { props: { username, collectibles } }
}
