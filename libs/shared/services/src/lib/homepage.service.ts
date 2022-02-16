import { Knex } from 'knex'

import {
  CollectibleBase,
  DEFAULT_LOCALE,
  Homepage,
  PublishedPack,
} from '@algomart/schemas'

import { CMSCacheAdapter } from '@algomart/shared/adapters'
import { userInvariant } from '@algomart/shared/utils'
import PacksService from './packs.service'
import CollectiblesService from './collectibles.service'
import { Transaction } from 'objection'

export default class HomepageService {
  constructor(
    private readonly cms: CMSCacheAdapter,
    private readonly packsService: PacksService,
    private readonly collectiblesService: CollectiblesService
  ) { }

  async getHomepage(
    trx: Transaction,
    knexRead: Knex,
    locale = DEFAULT_LOCALE
  ): Promise<Homepage> {
    const homepageBase = await this.cms.findHomepage(locale)
    userInvariant(homepageBase, 'homepage not found', 404)

    const { packs } = await this.packsService.getPublishedPacks({
      locale,
      pageSize: 1 + homepageBase.featuredPackTemplateIds.length,
      templateIds: homepageBase.heroPackTemplateId
        ? [
          ...homepageBase.featuredPackTemplateIds,
          homepageBase.heroPackTemplateId,
        ]
        : homepageBase.featuredPackTemplateIds,
    },
      trx,
      knexRead
    )

    const collectibles = await this.collectiblesService.getCollectibleTemplates(
      {
        locale,
        pageSize: 1 + homepageBase.featuredNftTemplateIds.length,
        templateIds: homepageBase.featuredNftTemplateIds,
      }
    )

    const packLookup = new Map(packs.map((pack) => [pack.templateId, pack]))
    const collectibleLookup = new Map(
      collectibles.map((collectible) => [collectible.templateId, collectible])
    )

    return {
      heroBanner: homepageBase.heroBanner,
      heroBannerSubtitle: homepageBase.heroBannerSubtitle,
      heroBannerTitle: homepageBase.heroBannerTitle,
      heroPack:
        homepageBase.heroPackTemplateId &&
          packLookup.has(homepageBase.heroPackTemplateId)
          ? packLookup.get(homepageBase.heroPackTemplateId)
          : undefined,
      featuredPacksSubtitle: homepageBase.featuredPacksSubtitle,
      featuredPacksTitle: homepageBase.featuredPacksTitle,
      featuredPacks: homepageBase.featuredPackTemplateIds
        .filter((id) => packLookup.has(id))
        .map((id) => packLookup.get(id) as PublishedPack),
      featuredNftsSubtitle: homepageBase.featuredNftsSubtitle,
      featuredNftsTitle: homepageBase.featuredNftsTitle,
      featuredNfts: homepageBase.featuredNftTemplateIds.map(
        (id) => collectibleLookup.get(id) as CollectibleBase
      ),
    }
  }
}
