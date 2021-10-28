import {
  CollectibleWithDetails,
  CollectionWithSets,
  SetBase,
} from '@algomart/schemas'
import { Translate } from 'next-translate'

import { urls } from './urls'

/**
 * Given a claimedAt date string and a number of days, determine if the claimedAt
 * date is later in time than the number of days since today
 */
export function collectibleIsNumberOfDaysOld(claimedAt: string, days = 3) {
  const numberOfDays = days * (1 * 24 * 60 * 60 * 1000)
  const claimedAtDate = new Date(claimedAt).valueOf()
  const numberOfDaysAgoDate = Date.now() - numberOfDays.valueOf()
  return claimedAtDate > numberOfDaysAgoDate
}

/**
 * Given an array of assets, and an array of collections,
 * return only collections that are associated with the assets.
 */
export function getCollectionsFromOwnedAssets(
  assets: CollectibleWithDetails[] = [],
  collections: CollectionWithSets[] = []
) {
  // Build unique list of collectible template IDs based on owned assets
  const ownedTemplateIds = new Set(
    new Set(assets.map((asset) => asset.templateId))
  )

  // Filter out any collections that don't have collectible templates
  return collections.filter(({ collectibleTemplateIds, sets }) => {
    let collectionIsActive = false
    for (const id of collectibleTemplateIds) {
      if (ownedTemplateIds.has(id)) {
        collectionIsActive = true
      }
    }
    for (const { collectibleTemplateIds } of sets) {
      for (const id of collectibleTemplateIds) {
        if (ownedTemplateIds.has(id)) {
          collectionIsActive = true
        }
      }
    }
    return collectionIsActive
  })
}

/**
 * Simple helper to reuse same tabs found throughout collections pages.
 */
export function getCollectionTabs(t: Translate) {
  return [
    { href: urls.myCollectibles, label: t('collection:tabs.NFTs') },
    { href: urls.myCollections, label: t('collection:tabs.Collections') },
    { href: urls.myShowcase, label: t('collection:tabs.Showcase') },
  ]
}

/**
 * Given a collection, count the total number of collectibles that are in the collection,
 * both in the sets as well as ungrouped collectibles.
 */
export function getTotalCollectiblesInCollection(
  collection: CollectionWithSets
): number {
  const setCollectibles = collection.sets.reduce(
    (accumulator: number, set: SetBase) =>
      accumulator + set.collectibleTemplateIds.length,
    0
  )

  const ungroupedCollectibles = collection.collectibleTemplateIds.length

  return setCollectibles + ungroupedCollectibles
}

/**
 * Given an array of assets, and an array of collectible ids,
 * return only assets that are associated with the collectible ids.
 */
export function getUngroupedAssetsFromCollection(
  assets: CollectibleWithDetails[] = [],
  collectibleIds: string[]
) {
  const ungrouped = assets.filter(({ templateId }) =>
    collectibleIds.includes(templateId)
  )

  return [
    ...new Map(ungrouped.map((asset) => [asset.templateId, asset])).values(),
  ]
}

/**
 * Given an array of assets, and an array of collections,
 * return an array where each item contains an object with
 * a collection, and the collection's corresponding assets.
 */
export function groupAssetsByCollection(
  assets: CollectibleWithDetails[] = [],
  collections: CollectionWithSets[] = []
) {
  const assetsMap = new Map(assets.map((a) => [a.templateId, a]))
  const groups = [] as {
    collection: CollectionWithSets
    assets: CollectibleWithDetails[]
  }[]

  for (const collection of collections) {
    const group: {
      collection: CollectionWithSets
      assets: CollectibleWithDetails[]
    } = {
      collection,
      assets: [],
    }

    groups.push(group)

    // Check collection for collectibles
    for (const collectibleId of collection.collectibleTemplateIds) {
      const asset = assetsMap.get(collectibleId)
      if (asset) {
        group.assets.push(asset)
      }
    }

    // Check collection's sets for collectibles
    for (const set of collection.sets) {
      for (const collectibleId of set.collectibleTemplateIds) {
        const asset = assetsMap.get(collectibleId)
        if (asset) {
          group.assets.push(asset)
        }
      }
    }
  }

  return groups
}

/**
 * Given an array of assets, and an array of sets,
 * return an array where each item contains an object with
 * a set, and the set's corresponding assets.
 */
export function groupAssetsBySet(
  assets: CollectibleWithDetails[] = [],
  sets: SetBase[]
) {
  const assetsMap = new Map(assets.map((a) => [a.templateId, a]))
  const groups = [] as { set: SetBase; assets: CollectibleWithDetails[] }[]

  for (const set of sets) {
    const group: { set: SetBase; assets: CollectibleWithDetails[] } = {
      set,
      assets: [],
    }

    groups.push(group)

    // Check set for collectibles
    for (const collectibleId of set.collectibleTemplateIds) {
      const asset = assetsMap.get(collectibleId)
      if (asset) {
        group.assets.push(asset)
      }
    }
  }

  return groups
}
