import { CollectibleWithDetails, CollectionWithSets } from '@algomart/schemas'
import useTranslation from 'next-translate/useTranslation'
import { useMemo } from 'react'

import CollectibleItem from '@/components/collectibles/collectible-item'
import CollectionHeader from '@/components/collectibles/collection-header'
import CollectionReward from '@/components/collectibles/collection-reward'
import CollectionSet from '@/components/collectibles/collection-set'
import Grid from '@/components/grid/grid'
import Tabs from '@/components/tabs/tabs'
import {
  getCollectionTabs,
  getTotalCollectiblesInCollection,
  getUngroupedAssetsFromCollection,
  groupAssetsByCollection,
  groupAssetsBySet,
} from '@/utils/collections'

export interface MyCollectionTemplateProps {
  assets: CollectibleWithDetails[]
  collection: CollectionWithSets
  handleRedirectBrand: () => void
}

export default function MyCollectionTemplate({
  assets,
  collection,
  handleRedirectBrand,
}: MyCollectionTemplateProps) {
  const { t } = useTranslation()

  const totalCollected = useMemo(
    () => groupAssetsByCollection(assets, [collection])[0].assets.length,
    [assets, collection]
  )
  const totalCollectibles = useMemo(
    () => getTotalCollectiblesInCollection(collection),
    [collection]
  )
  const ungroupedAssets = useMemo(() => {
    return collection.collectibleTemplateIds
      ? getUngroupedAssetsFromCollection(
          assets,
          collection.collectibleTemplateIds
        )
      : []
  }, [assets, collection])

  return (
    <>
      {/* Tabs */}
      <Tabs activeTab={1} tabs={getCollectionTabs(t)} />

      <CollectionHeader collection={collection} />

      {/* Collection Reward */}
      {collection.reward && (
        <CollectionReward
          collectionName={collection.name}
          handleRedirectBrand={handleRedirectBrand}
          reward={collection.reward}
          totalCollected={totalCollected}
          totalCollectibles={totalCollectibles}
        />
      )}

      {/* Sets */}
      {collection.sets &&
        groupAssetsBySet(assets, collection.sets).map(({ assets, set }) => (
          <CollectionSet assets={assets} key={set.id} set={set} />
        ))}

      {/* Ungrouped collectibles */}
      {ungroupedAssets.length > 0 && (
        <>
          {/* If there are sets AND collectibles that don't belong to sets, denote that */}
          {collection.sets.length > 0 && (
            <div className="pb-1 mb-4 text-center border-b border-base-gray-border">
              <div className="text-lg">
                {t('collection:collectionPage.Other Collectibles')}
              </div>
            </div>
          )}
          <Grid>
            {ungroupedAssets.map((asset) => (
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
                title={asset.title}
              />
            ))}
            {/* Show hidden tiles for uncollected collectibles */}
            {collection.collectibleTemplateIds &&
              Array.from({
                length:
                  collection.collectibleTemplateIds.length -
                  ungroupedAssets.length,
              })
                .fill('?')
                .map((_, index) => (
                  <CollectibleItem
                    cardView
                    key={index}
                    questionMarkSize="medium"
                    title={t('common:statuses.Uncollected')}
                    uncollected
                  />
                ))}
          </Grid>
        </>
      )}
    </>
  )
}
