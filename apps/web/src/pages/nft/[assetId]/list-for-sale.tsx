import { CollectibleWithDetails } from '@algomart/schemas'
import { GetServerSideProps } from 'next'

import { ApiClient } from '@/clients/api-client'
import { AppConfig } from '@/config'
import DefaultLayout from '@/layouts/default-layout'
import NFTListForSaleTemplate from '@/templates/nft-list-for-sale-template'

export default function NFTListForSalePage({
  collectible,
}: {
  collectible: CollectibleWithDetails
}) {
  return (
    <DefaultLayout fullBleed pageTitle={collectible.title} variant="colorful">
      <NFTListForSaleTemplate collectible={collectible} />
    </DefaultLayout>
  )
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  const { assetId } = context.query
  const client = new ApiClient(AppConfig.apiURL)
  const collectible = await client.getCollectible({
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
