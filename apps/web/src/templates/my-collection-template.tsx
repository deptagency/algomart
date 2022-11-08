import { CollectibleWithDetails, CollectionWithSets } from '@algomart/schemas'
import useTranslation from 'next-translate/useTranslation'
import { useMemo } from 'react'

import common from './common-template-styles.module.css'

import CollectionHeader from '@/components/collectibles/collection-header'
import CollectionSet from '@/components/collectibles/collection-set'
import UngroupedCollectibles from '@/components/collectibles/ungrouped-collectibles'
import { H1 } from '@/components/heading'
import Loading from '@/components/loading/loading'
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
}

export default function MyCollectionTemplate({
  assets,
  collection,
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
      <H1 className={common.pageHeading}>{collection.name}</H1>

      <Tabs activeTab={1} tabs={getCollectionTabs(t)} />

      <CollectionHeader
        collection={collection}
        totalCollected={totalCollected}
        totalCollectibles={totalCollectibles}
      />

      {/* Grouped collectibles (sets) */}
      {collection.sets ? (
        groupAssetsBySet(assets, collection.sets).map(({ assets, set }) => (
          <CollectionSet assets={assets} key={set.id} set={set} />
        ))
      ) : (
        <div className={common.loadingWrapper}>
          <Loading />
        </div>
      )}

      {/* Ungrouped collectibles */}
      {ungroupedAssets.length > 0 && (
        <UngroupedCollectibles
          assets={ungroupedAssets}
          collection={collection}
        />
      )}
    </>
  )
}
