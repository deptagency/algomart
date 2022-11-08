import { CollectibleWithDetails, SetBase } from '@algomart/schemas'
import useTranslation from 'next-translate/useTranslation'

import css from './collection-set.module.css'

import CollectionItem from '@/components/collectibles/collection-item'
import { H2 } from '@/components/heading'
import LinkButton from '@/components/link-button'
import { urlFor, urls } from '@/utils/urls'

export interface CollectionSetProps {
  assets: CollectibleWithDetails[]
  set: SetBase
}

export default function CollectionSet({ assets, set }: CollectionSetProps) {
  const assetsMap = new Map(assets.map((a) => [a.templateId, a]))

  return (
    <section className={css.root}>
      <CollectionSetHeader
        setName={set.name}
        collectedCount={assets.length}
        totalCount={set.collectibleTemplateIds.length}
        setSlug={set.slug}
      />

      {/* Set thumbnails */}
      <div className={css.sideScrollArea}>
        {set.collectibleTemplateIds.map((collectible) => {
          const asset = assetsMap.get(collectible)
          return asset ? (
            <CollectionItem
              key={collectible}
              collectible={asset}
              href={urlFor(urls.nft, { assetId: asset.address })}
            />
          ) : (
            <CollectionItem key={collectible} />
          )
        })}
      </div>
    </section>
  )
}

interface CollectionSetHeaderProps {
  setName: string
  collectedCount: number
  totalCount: number
  setSlug?: string
}

export function CollectionSetHeader({
  setName,
  collectedCount,
  totalCount,
  setSlug,
}: CollectionSetHeaderProps) {
  const { t } = useTranslation()

  return (
    <div className={css.setInfo}>
      <div>
        <H2 uppercase>{setName}</H2>
        <strong className={css.setText}>
          {`${t('collection:collectionPage.Number of Total', {
            number: collectedCount,
            total: totalCount,
          })} ${t('common:statuses.Collected')}`}
        </strong>
      </div>
      {setSlug ? (
        <LinkButton href={urlFor(urls.mySet, { setSlug })} variant="outline">
          {t('common:actions.View Set')}
        </LinkButton>
      ) : undefined}
    </div>
  )
}
