import { Knex } from 'knex'

import {
  DEFAULT_LOCALE,
  Homepage,
  PublishedPack,
} from '@algomart/schemas'

import { CMSCacheAdapter } from '@algomart/shared/adapters'
import { userInvariant } from '@algomart/shared/utils'
import PacksService from './packs.service'
import { Transaction } from 'objection'

export default class HomepageService {
  constructor(
    private readonly cms: CMSCacheAdapter,
    private readonly packsService: PacksService
  ) { }

  async getHomepage(
    trx: Transaction,
    knexRead: Knex,
    locale = DEFAULT_LOCALE
  ): Promise<Homepage> {
    const homepageBase = await this.cms.findHomepage(locale)
    userInvariant(homepageBase, 'homepage not found', 404)

    const { packs } = await this.packsService.getPublishedPacks(
      {
        locale: locale,
        templates: homepageBase.heroPackTemplate
          ? [...homepageBase.featuredPackTemplates, homepageBase.heroPackTemplate]
          : homepageBase.featuredPackTemplates,
      },
      knexRead
    )

    const packLookup = new Map(packs.map((pack) => [pack.templateId, pack]))

    return {
      heroBanner: homepageBase.heroBanner,
      heroBannerSubtitle: homepageBase.heroBannerSubtitle,
      heroBannerTitle: homepageBase.heroBannerTitle,
      heroPack:
        homepageBase.heroPackTemplate &&
          packLookup.has(homepageBase.heroPackTemplate.templateId)
          ? packLookup.get(homepageBase.heroPackTemplate.templateId)
          : undefined,
      featuredPacksSubtitle: homepageBase.featuredPacksSubtitle,
      featuredPacksTitle: homepageBase.featuredPacksTitle,
      featuredPacks: homepageBase.featuredPackTemplates
        .filter((template) => packLookup.has(template.templateId))
        .map(
          (template) => packLookup.get(template.templateId) as PublishedPack
        ),
      featuredNftsSubtitle: homepageBase.featuredNftsSubtitle,
      featuredNftsTitle: homepageBase.featuredNftsTitle,
      featuredNfts: homepageBase.featuredNfts,
    }
  }
}
