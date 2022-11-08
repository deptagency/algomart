import { CollectibleWithDetails, CollectionWithSets } from '@algomart/schemas'
import Image from 'next/image'
import useTranslation from 'next-translate/useTranslation'
import { useMemo } from 'react'

import common from './common-template-styles.module.css'
import css from './my-collections-template.module.css'

import AppLink from '@/components/app-link/app-link'
import NoCollectiblesContent from '@/components/collectibles/no-collectibles-content'
import Grid from '@/components/grid/grid'
import { H1 } from '@/components/heading'
import Tabs from '@/components/tabs/tabs'
import { getCollectionTabs, groupAssetsByCollection } from '@/utils/collections'
import { urlFor, urls } from '@/utils/urls'

export interface MyCollectionsTemplateProps {
  assets: CollectibleWithDetails[]
  collections: CollectionWithSets[]
}

export default function MyCollectionsTemplate({
  assets,
  collections,
}: MyCollectionsTemplateProps) {
  const { t } = useTranslation()

  const collectionGroups = useMemo(
    () => groupAssetsByCollection(assets, collections),
    [assets, collections]
  )

  return (
    <>
      <H1 className={common.pageHeading}>
        {t('common:pageTitles.My Collections')}
      </H1>

      <Tabs activeTab={1} tabs={getCollectionTabs(t)} />

      <section className={css.container}>
        {collectionGroups.length > 0 ? (
          <Grid base={2}>
            {collectionGroups.map(({ collection }) => (
              <AppLink
                className={css.collectionLink}
                href={urlFor(urls.myCollection, {
                  collectionSlug: collection.slug,
                })}
                key={collection.id}
              >
                <div className={css.imageWrapper}>
                  <div className={css.image}>
                    <Image
                      alt={collection.name}
                      layout="responsive"
                      objectFit="cover"
                      src={collection.image}
                      height={320}
                      width={320}
                    />
                  </div>
                </div>
                <div className={css.textTitle}>{collection.name}</div>
              </AppLink>
            ))}
          </Grid>
        ) : (
          <NoCollectiblesContent />
        )}
      </section>
    </>
  )
}
