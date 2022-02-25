import { CollectibleWithDetails } from '@algomart/schemas'
import { GetServerSideProps } from 'next'

import { ApiClient } from '@/clients/api-client'
import { useAuth } from '@/contexts/auth-context'
import DefaultLayout from '@/layouts/default-layout'
import NFTTemplate from '@/templates/nft-template'

export default function NFTPage({
  collectible,
  currentOwnerHasShowcase,
}: {
  collectible: CollectibleWithDetails
  currentOwnerHasShowcase: boolean
}) {
  const auth = useAuth()

  return (
    <DefaultLayout noPanel pageTitle={collectible.title}>
      <NFTTemplate
        collectible={collectible}
        userAddress={auth.user?.address}
        currentOwnerHasShowcase={currentOwnerHasShowcase}
      />
    </DefaultLayout>
  )
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  const { assetId } = context.query
  const collectible = await ApiClient.instance.getCollectible({
    assetId: Number(assetId),
  })

  let currentOwnerHasShowcase = false
  if (collectible.currentOwner) {
    const result = await ApiClient.instance.getShowcaseByUser({
      ownerUsername: collectible.currentOwner,
    })

    if (result?.showProfile && result?.collectibles?.length > 0) {
      currentOwnerHasShowcase = true
    }
  }

  return {
    props: {
      collectible,
      currentOwnerHasShowcase,
    },
  }
}
