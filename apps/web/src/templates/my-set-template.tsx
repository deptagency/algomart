import {
  CollectibleWithDetails,
  CollectionWithSets,
  SetWithCollection,
} from '@algomart/schemas'
import useTranslation from 'next-translate/useTranslation'
import { useMemo } from 'react'

import common from './common-template-styles.module.css'
import css from './my-set-template.module.css'

import CollectionHeader from '@/components/collectibles/collection-header'
import CollectionItem from '@/components/collectibles/collection-item'
import { CollectionSetHeader } from '@/components/collectibles/collection-set'
import Grid from '@/components/grid/grid'
import { H1 } from '@/components/heading'
import Tabs from '@/components/tabs/tabs'
import {
  getCollectionTabs,
  getTotalCollectiblesInCollection,
  groupAssetsByCollection,
  groupAssetsBySet,
} from '@/utils/collections'

export interface MySetTemplateProps {
  assets: CollectibleWithDetails[]
  collection: CollectionWithSets
  set: SetWithCollection
}

export default function MySetTemplate({
  assets,
  set,
  collection,
}: MySetTemplateProps) {
  const { t } = useTranslation()

  // Collection collectibles
  const totalCollected = useMemo(
    () => groupAssetsByCollection(assets, [collection])[0].assets.length,
    [assets, collection]
  )
  const totalCollectibles = useMemo(
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
      <H1 className={common.pageHeading}>{set.name}</H1>
      <Tabs activeTab={1} tabs={getCollectionTabs(t)} />

      <CollectionHeader
        collection={collection}
        totalCollected={totalCollected}
        totalCollectibles={totalCollectibles}
      />
      {set.collectibleTemplateIds && (
        <section className={css.setWrapper}>
          <CollectionSetHeader
            setName={set.name}
            collectedCount={assets.length}
            totalCount={set.collectibleTemplateIds.length}
          />
          <Grid base={2} sm={3} md={4} lg={5} gapBase={7}>
            {collectedSetAssets.map((asset) => (
              <CollectionItem collectible={asset} key={asset.id} />
            ))}
            {uncollectedSetAssets.map((_, index) => (
              <CollectionItem key={index} />
            ))}
          </Grid>
        </section>
      )}
    </>
  )
}
