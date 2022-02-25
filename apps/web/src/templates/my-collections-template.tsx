import { CollectibleWithDetails, CollectionWithSets } from '@algomart/schemas'
import useTranslation from 'next-translate/useTranslation'
import { useMemo } from 'react'

import AppLink from '@/components/app-link/app-link'
import CollectionGroup from '@/components/collectibles/collection-group'
import NoCollectiblesContent from '@/components/collectibles/no-collectibles-content'
import Grid from '@/components/grid/grid'
import Tabs from '@/components/tabs/tabs'
import { getCollectionTabs, groupAssetsByCollection } from '@/utils/collections'
import { urls } from '@/utils/urls'

export interface MyCollectionsTemplateProps {
  assets: CollectibleWithDetails[]
  collections: CollectionWithSets[]
  handleRedirectBrands: () => void
}

export default function MyCollectionsTemplate({
  assets,
  collections,
  handleRedirectBrands,
}: MyCollectionsTemplateProps) {
  const { t } = useTranslation()

  const collectionGroups = useMemo(
    () => groupAssetsByCollection(assets, collections),
    [assets, collections]
  )

  return (
    <>
      {/* Tabs */}
      <Tabs activeTab={1} tabs={getCollectionTabs(t)} />

      {/* Collections */}
      <section className="mt-12">
        {collectionGroups.length > 0 ? (
          <Grid columns={2}>
            {collectionGroups.map(({ collection }) => {
              return (
                <AppLink
                  className="no-underline"
                  href={urls.myCollection.replace(
                    ':collectionSlug',
                    collection.slug
                  )}
                  key={collection.id}
                >
                  <CollectionGroup collection={collection} />
                </AppLink>
              )
            })}
          </Grid>
        ) : (
          <NoCollectiblesContent handleRedirect={handleRedirectBrands} />
        )}
      </section>
    </>
  )
}
