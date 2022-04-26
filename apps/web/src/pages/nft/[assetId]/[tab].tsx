import { CollectibleWithDetails } from '@algomart/schemas'
import { GetServerSideProps } from 'next'

import { ApiClient } from '@/clients/api-client'
import { useAuth } from '@/contexts/auth-context'
import DefaultLayout from '@/layouts/default-layout'
import { getAuthenticatedUser } from '@/services/api/auth-service'
import NFTTemplate from '@/templates/nft-template'

export default function NFTPage({
  collectible,
  externalId,
}: {
  collectible: CollectibleWithDetails
  externalId?: string
}) {
  const auth = useAuth()

  return (
    <DefaultLayout noPanel pageTitle={collectible.title}>
      <NFTTemplate
        collectible={collectible}
        userAddress={auth.user?.address}
        userExternalId={externalId}
      />
    </DefaultLayout>
  )
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  const { assetId } = context.query
  const collectible = await ApiClient.instance.getCollectible({
    assetId: Number(assetId),
  })

  const user = await getAuthenticatedUser(context)
  const { externalId } = user

  return {
    props: {
      collectible,
      externalId: externalId ?? undefined,
    },
  }
}
