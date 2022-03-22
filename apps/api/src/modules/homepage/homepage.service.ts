import {
  CollectibleBase,
  DEFAULT_LANG,
  Homepage,
  PublishedPack,
} from '@algomart/schemas'
import { userInvariant } from '@algomart/shared/utils'
import CMSCacheAdapter from '@api/lib/cms-cache-adapter'
import PacksService from '@api/modules/packs/packs.service'

export default class HomepageService {
  constructor(
    private readonly cms: CMSCacheAdapter,
    private readonly packsService: PacksService
  ) {}

  async getHomepage(language = DEFAULT_LANG): Promise<Homepage> {
    const homepageBase = await this.cms.findHomepage(language)
    userInvariant(homepageBase, 'homepage not found', 404)

    const templates = homepageBase.featuredPackTemplateId
      ? [
          ...homepageBase.upcomingPackTemplateIds,
          homepageBase.featuredPackTemplateId,
        ]
      : homepageBase.upcomingPackTemplateIds

    const packs = await this.packsService.getPublishedPacksByTemplates(
      templates
    )

    const collectibles = await this.cms.findCollectiblesByTemplateIds(
      homepageBase.notableCollectibleTemplateIds,
      language
    )

    const packLookup = new Map<string, PublishedPack>(
      packs.map((pack) => [pack.templateId, pack as PublishedPack])
    )
    const collectibleLookup = new Map(
      collectibles.map((collectible) => [collectible.templateId, collectible])
    )

    return {
      featuredPack:
        homepageBase.featuredPackTemplateId &&
        packLookup.has(homepageBase.featuredPackTemplateId)
          ? packLookup.get(homepageBase.featuredPackTemplateId)
          : undefined,
      upcomingPacks: homepageBase.upcomingPackTemplateIds
        .filter((id) => packLookup.has(id))
        .map((id) => packLookup.get(id) as PublishedPack),
      notableCollectibles: homepageBase.notableCollectibleTemplateIds.map(
        (id) => collectibleLookup.get(id) as CollectibleBase
      ),
    }
  }
}
