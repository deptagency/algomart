import { CollectibleWithDetails } from '@algomart/schemas'
import { GetStaticPaths, GetStaticProps } from 'next'

import { ApiClient } from '@/clients/api-client'
import { AppConfig } from '@/config'
import DefaultLayout from '@/layouts/default-layout'
import NFTTemplate from '@/templates/nft-template'

export default function NFTPage({
  collectible,
}: {
  collectible: CollectibleWithDetails
}) {
  return (
    <DefaultLayout fullBleed pageTitle={collectible.title}>
      <NFTTemplate collectible={collectible} />
    </DefaultLayout>
  )
}

export const getStaticPaths: GetStaticPaths = async () => {
  return {
    fallback: 'blocking',
    paths: [],
  }
}

export const getStaticProps: GetStaticProps = async (context) => {
  const { assetId } = context.params
  const client = new ApiClient(AppConfig.apiURL)
  const collectible = await client.getCollectible({
    assetId: Number(assetId),
  })

  if (!collectible) {
    return { notFound: true, revalidate: 1 }
  }

  return { props: { collectible }, revalidate: 60 }
}
