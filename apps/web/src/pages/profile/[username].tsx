import { CollectibleWithDetails } from '@algomart/schemas'
import { GetServerSideProps } from 'next'
import useTranslation from 'next-translate/useTranslation'

import { ApiClient } from '@/clients/api-client'
import ProfileUsernameLayout from '@/layouts/profile-username-layout'
import ProfileUsernameTemplate from '@/templates/profile-username-template'

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
    <ProfileUsernameLayout
      pageTitle={t('common:pageTitles.User Profile', { name: username })}
    >
      <ProfileUsernameTemplate
        username={username}
        collectibles={collectibles}
      />
    </ProfileUsernameLayout>
  )
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  const username = context.params?.username as string
  const result = await ApiClient.instance.getShowcaseByUser({
    ownerUsername: username,
  })

  if (!result || !result.showProfile || result.collectibles.length === 0) {
    return {
      notFound: true,
    }
  }

  return {
    props: {
      username,
      collectibles: result.collectibles,
    },
  }
}
