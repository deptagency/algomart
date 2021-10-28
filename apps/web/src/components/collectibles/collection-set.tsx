import { CollectibleWithDetails, SetBase } from '@algomart/schemas'
import clsx from 'clsx'
import useTranslation from 'next-translate/useTranslation'

import css from './collection-set.module.css'

import AppLink from '@/components/app-link/app-link'
import CollectibleItem from '@/components/collectibles/collectible-item'
import Heading from '@/components/heading'
import { urls } from '@/utils/urls'

export interface CollectionSetProps {
  assets: CollectibleWithDetails[]
  set: SetBase
}

export default function CollectionSet({ assets, set }: CollectionSetProps) {
  const { t } = useTranslation()
  const assetsMap = new Map(assets.map((a) => [a.templateId, a]))
  const length =
    (set.collectibleTemplateIds.length * 8 -
      set.collectibleTemplateIds.length) %
    8
  const emptySpots = Array.from({ length }).fill('ø')

  return (
    <section className={css.root}>
      {/* Set information */}
      <div className={css.setInfo}>
        <span className={clsx(css.setText, css.setNumberCollected)}>
          {t('collection:collectionPage.Number of Total Collected', {
            number: assets.length,
            total: set.collectibleTemplateIds.length,
          })}
        </span>
        <Heading className={css.setName} level={2}>
          {set.name}
        </Heading>
        <AppLink
          className={clsx(css.setText, css.setLink)}
          href={urls.mySet.replace(':setSlug', set.slug)}
        >
          {t('common:actions.View Set')}
        </AppLink>
      </div>

      {/* Set thumbnails */}
      <div className={css.setGrid}>
        {set.collectibleTemplateIds.map((collectible) => {
          const asset = assetsMap.get(collectible)
          return (
            <div key={collectible} className={css.setAsset}>
              {asset ? (
                // If collected, show the collectible
                <CollectibleItem alt={asset.title} imageUrl={asset.image} />
              ) : (
                // Otherwise, show an uncolllected "?"
                <CollectibleItem questionMarkSize="small" uncollected />
              )}
            </div>
          )
        })}
        {/* Show empty spots to fill the grid row */}
        {emptySpots.map((_, index) => {
          return <div key={index} className={css.setGridEmpty} />
        })}
      </div>
    </section>
  )
}
