import { CollectibleWithDetails } from '@algomart/schemas'
import { GetServerSideProps } from 'next'

import { ApiClient } from '@/clients/api-client'
import { useAuth } from '@/contexts/auth-context'
import DefaultLayout from '@/layouts/default-layout'
import NFTTemplate from '@/templates/nft-template'

export default function NFTPage({
  collectible,
}: {
  collectible: CollectibleWithDetails
}) {
  const auth = useAuth()

  return (
    <DefaultLayout noPanel pageTitle={collectible.title}>
      <NFTTemplate collectible={collectible} userAddress={auth.user?.address} />
    </DefaultLayout>
  )
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  const { assetId } = context.query
  const collectible = await ApiClient.instance.getCollectible({
    assetId: Number(assetId),
  })

  if (!collectible) {
    return {
      notFound: true,
    }
  }

  return {
    props: {
      collectible,
    },
  }
}
