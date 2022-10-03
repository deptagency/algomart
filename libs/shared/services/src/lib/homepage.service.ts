import { DEFAULT_LANG, Homepage, PublishedPack } from '@algomart/schemas'
import { userInvariant } from '@algomart/shared/utils'

import { CMSCacheService } from './cms-cache.service'
import { PacksService } from './packs.service'

export class HomepageService {
  constructor(
    private readonly cms: CMSCacheService,
    private readonly packsService: PacksService
  ) {}

  async getHomepage(language = DEFAULT_LANG): Promise<Homepage> {
    const homepageBase = await this.cms.findHomepage(language)
    userInvariant(homepageBase, 'homepage not found', 404)

    const templates = homepageBase.heroPackTemplate
      ? [...homepageBase.featuredPackTemplates, homepageBase.heroPackTemplate]
      : homepageBase.featuredPackTemplates

    const packs = await this.packsService.getPublishedPacksByTemplates(
      templates
    )
    const packLookup = new Map<string, PublishedPack>(
      packs.map((pack) => [pack.templateId, pack as PublishedPack])
    )

    return {
      heroBanner: homepageBase.heroBanner,
      heroBannerSubtitle: homepageBase.heroBannerSubtitle,
      heroBannerTitle: homepageBase.heroBannerTitle,
      heroBannerType: homepageBase.heroBannerType,
      heroPack:
        homepageBase.heroPackTemplate &&
        packLookup.has(homepageBase.heroPackTemplate.templateId)
          ? packLookup.get(homepageBase.heroPackTemplate.templateId)
          : undefined,
      featuredFaqs: homepageBase.featuredFaqs,
      featuredPacksSubtitle: homepageBase.featuredPacksSubtitle,
      featuredPacksTitle: homepageBase.featuredPacksTitle,
      featuredPacks: homepageBase.featuredPackTemplates
        .filter((template) => packLookup.has(template.templateId))
        .map(
          (template) => packLookup.get(template.templateId) as PublishedPack
        ),
      featuredNftsSubtitle: homepageBase.featuredNftsSubtitle,
      featuredNftsTitle: homepageBase.featuredNftsTitle,
      featuredNfts: homepageBase.featuredNftTemplates,
      featuredRarities: homepageBase.featuredRarities,
    }
  }
}
