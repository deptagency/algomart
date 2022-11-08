import { CollectibleWithDetails, CollectionWithSets } from '@algomart/schemas'
import useTranslation from 'next-translate/useTranslation'

import css from './ungrouped-collectibles.module.css'

import CollectibleItem from '@/components/collectibles/collectible-item'
import Grid from '@/components/grid/grid'
import { H2 } from '@/components/heading'

export interface UngroupedCollectiblesProps {
  assets: CollectibleWithDetails[]
  collection: CollectionWithSets
}

export default function UngroupedCollectibles({
  assets,
  collection,
}: UngroupedCollectiblesProps) {
  const { t } = useTranslation()

  return (
    <section className={css.root}>
      {/* If there are sets AND collectibles that don't belong to sets, denote that */}
      {collection.sets.length > 0 && (
        <>
          <H2 uppercase>{t('collection:collectionPage.Other Collectibles')}</H2>
          <strong className={css.numberCollected}>
            {`${t('collection:collectionPage.Number of Total', {
              number: assets.length,
              total: collection.collectibleTemplateIds.length,
            })} ${t('common:statuses.Collected')}`}
          </strong>
        </>
      )}

      <Grid base={2} sm={3} md={4} lg={5}>
        {assets.map((asset) => (
          <CollectibleItem collectible={asset} key={asset.id} />
        ))}
        {/* Show hidden tiles for uncollected collectibles */}
        {collection.collectibleTemplateIds &&
          Array.from({
            length: collection.collectibleTemplateIds.length - assets.length,
          }).map((_, index) => <CollectibleItem key={index} uncollected />)}
      </Grid>
    </section>
  )
}
