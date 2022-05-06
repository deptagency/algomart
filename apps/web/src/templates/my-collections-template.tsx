import { CollectibleWithDetails, CollectionWithSets } from '@algomart/schemas'
import useTranslation from 'next-translate/useTranslation'
import { useMemo } from 'react'

import AppLink from '@/components/app-link/app-link'
import CollectionGroup from '@/components/collectibles/collection-group'
import NoCollectiblesContent from '@/components/collectibles/no-collectibles-content'
import Grid from '@/components/grid/grid'
import Tabs from '@/components/tabs/tabs'
import { getCollectionTabs, groupAssetsByCollection } from '@/utils/collections'
import { urlFor, urls } from '@/utils/urls'

export interface MyCollectionsTemplateProps {
  assets: CollectibleWithDetails[]
  collections: CollectionWithSets[]
  onRedirectBrands: () => void
}

export default function MyCollectionsTemplate({
  assets,
  collections,
  onRedirectBrands,
}: MyCollectionsTemplateProps) {
  const { t } = useTranslation()

  const collectionGroups = useMemo(
    () => groupAssetsByCollection(assets, collections),
    [assets, collections]
  )

  return (
    <>
      {/* Tabs */}
      <Tabs activeTab={1} tabs={getCollectionTabs(t)} className="-mx-8 -mt-8" />

      {/* Collections */}
      <section className="mt-12">
        {collectionGroups.length > 0 ? (
          <Grid columns={2}>
            {collectionGroups.map(({ collection }) => {
              return (
                <AppLink
                  className="no-underline"
                  href={urlFor(urls.myCollection, {
                    collectionSlug: collection.slug,
                  })}
                  key={collection.id}
                >
                  <CollectionGroup collection={collection} />
                </AppLink>
              )
            })}
          </Grid>
        ) : (
          <NoCollectiblesContent onRedirect={onRedirectBrands} />
        )}
      </section>
    </>
  )
}
