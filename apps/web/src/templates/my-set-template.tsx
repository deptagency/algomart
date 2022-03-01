import {
  CollectibleWithDetails,
  CollectionWithSets,
  SetWithCollection,
} from '@algomart/schemas'
import clsx from 'clsx'
import useTranslation from 'next-translate/useTranslation'
import { useMemo } from 'react'

import CollectibleItem from '@/components/collectibles/collectible-item'
import CollectionReward from '@/components/collectibles/collection-reward'
import SetHeader from '@/components/collectibles/set-header'
import Grid from '@/components/grid/grid'
import Tabs from '@/components/tabs/tabs'
import {
  getCollectionTabs,
  getTotalCollectiblesInCollection,
  groupAssetsByCollection,
  groupAssetsBySet,
} from '@/utils/collections'

export interface MySetTemplateProps {
  assets: CollectibleWithDetails[]
  handleRedirectBrand: () => void
  collection: CollectionWithSets
  set: SetWithCollection
}

export default function MySetTemplate({
  assets,
  handleRedirectBrand,
  set,
  collection,
}: MySetTemplateProps) {
  const { t } = useTranslation()

  // Collection collectibles
  const totalCollectionAssetsCollected = useMemo(
    () => groupAssetsByCollection(assets, [collection])[0].assets.length,
    [assets, collection]
  )
  const totalCollectiblesInCollection = useMemo(
    () => getTotalCollectiblesInCollection(collection),
    [collection]
  )

  // Set collectibles
  const totalSetCollectibles = set.collectibleTemplateIds.length
  const { assets: collectedSetAssets } = useMemo(
    () => groupAssetsBySet(assets, [set])[0],
    [assets, set]
  )
  const uncollectedSetAssets = useMemo(
    () =>
      Array.from({
        length: totalSetCollectibles - collectedSetAssets.length,
      }).fill('?'),
    [totalSetCollectibles, collectedSetAssets.length]
  )

  return (
    <>
      <Tabs activeTab={1} tabs={getCollectionTabs(t)} />

      <SetHeader
        set={set}
        collectionSlug={collection.slug}
        collectionName={collection.name}
      />

      {set.collectibleTemplateIds && (
        <div
          // Apply extra wide grid per design when an entire row is full (>= 4)
          className={clsx({
            'sm:left-2/4 sm:max-w-wrapper sm:px-4 sm:relative sm:transform sm:w-screen sm:-translate-x-2/4':
              totalSetCollectibles > 3,
          })}
        >
          <Grid columns={totalSetCollectibles > 3 ? 4 : 3}>
            {collectedSetAssets.map((asset, index) => (
              <CollectibleItem
                alt={asset.title}
                cardView
                imageUrl={asset.image}
                key={asset.id}
                rarity={
                  asset.rarity || {
                    name: t('common:global.rarityDefault'),
                  }
                }
                setNumber={index + 1}
                title={asset.title}
              />
            ))}
            {uncollectedSetAssets.map((_, index) => (
              <CollectibleItem
                cardView
                key={index}
                questionMarkSize="large"
                setNumber={collectedSetAssets.length + index + 1}
                title={t('common:statuses.Uncollected')}
                uncollected
              />
            ))}
          </Grid>
        </div>
      )}

      {/* Collection Reward */}
      {collection.reward && (
        <CollectionReward
          collectionName={collection.name}
          handleRedirectBrand={handleRedirectBrand}
          reward={collection.reward}
          totalCollected={totalCollectionAssetsCollected}
          totalCollectibles={totalCollectiblesInCollection}
        />
      )}
    </>
  )
}
