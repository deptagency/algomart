import { CollectibleWithDetails } from '@algomart/schemas'
import { GetServerSideProps } from 'next'
import Image from 'next/image'
import { useRouter } from 'next/router'

import { ApiClient } from '@/clients/api-client'
import Button from '@/components/button'
import LinkButton from '@/components/link-button'
import MediaGallery from '@/components/media-gallery/media-gallery'
import ReleaseDescription from '@/components/release-details/sections/release-description'
import { useAuth } from '@/contexts/auth-context'
import DefaultLayout from '@/layouts/default-layout'

export default function NFTPage({
  collectible,
}: {
  collectible: CollectibleWithDetails
}) {
  const auth = useAuth()

  return (
    <DefaultLayout noPanel pageTitle={collectible.title}>
      <div className="ml-auto mr-auto max-w-700">
        <div className="shadow-large bg-base-bgPanel">
          <MediaGallery media={[collectible.image]} />

          <div className="p-6">
            <h1 className="text-2xl font-bold text-center">
              {collectible.title}
            </h1>
            {collectible.collection ? (
              <h2 className="text-center underline text-base-gray-medium">
                {collectible.collection.name}
              </h2>
            ) : null}
          </div>

          <div className="px-6 pb-6 text-center">
            {/* TODO enable this for secondary marketplace */}
            <LinkButton size="small" disabled href="/">
              Sell NFT
            </LinkButton>
            <LinkButton
              href={`/nft/${collectible.templateId}/${collectible.address}/transfer`}
              size="small"
              variant="tertiary"
              disabled={auth.user?.address !== collectible.currentOwnerAddress}
            >
              Transfer NFT
            </LinkButton>
          </div>

          {/* TODO: add tabs for description, activity, listings, and offers */}

          <ReleaseDescription description={collectible.body} />

          <div className="px-6 pb-6">
            <div className="overflow-hidden text-sm border rounded-md border-base-border">
              <ul role="list" className="divide-y divide-base-border">
                {collectible.currentOwner ? (
                  <li className="flex justify-between px-5 py-5">
                    <span className="font-bold">Owner</span>
                    <span>@{collectible.currentOwner}</span>
                  </li>
                ) : null}
                {/* TODO: add publisher details */}
                {/* <li className="flex justify-between px-5 py-5">
                  <span className="font-bold">Publisher</span>
                  <span>---</span>
                </li> */}
                {collectible.collection ? (
                  <li className="flex justify-between px-5 py-5">
                    <span className="font-bold">Collection</span>
                    <span>{collectible.collection.name}</span>
                  </li>
                ) : null}
                <li className="flex justify-between px-5 py-5">
                  <span className="font-bold">Edition</span>
                  <span>
                    #{collectible.edition} of {collectible.totalEditions}
                  </span>
                </li>
                {collectible.rarity ? (
                  <li className="flex justify-between px-5 py-5">
                    <span className="font-bold">Rarity</span>
                    <span>{collectible.rarity.name}</span>
                  </li>
                ) : null}
                <li className="flex justify-between px-5 py-5">
                  <span className="font-bold">Address</span>
                  <span>{collectible.address}</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </DefaultLayout>
  )
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  const { templateId, assetId } = context.query
  const collectible = await ApiClient.instance.getCollectible({
    templateId: templateId as string,
    assetId: Number(assetId),
  })
  return {
    props: {
      collectible,
    },
  }
}
