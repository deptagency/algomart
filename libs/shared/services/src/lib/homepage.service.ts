import {
  CollectibleBase,
  DEFAULT_LANG,
  Homepage,
  PublishedPack,
} from '@algomart/schemas'
import { CMSCacheAdapter } from '@algomart/shared/adapters'
import { userInvariant } from '@algomart/shared/utils'

import { PacksService } from './'

export class HomepageService {
  constructor(
    private readonly cms: CMSCacheAdapter,
    private readonly packsService: PacksService
  ) {}

  async getHomepage(language = DEFAULT_LANG): Promise<Homepage> {
    const homepageBase = await this.cms.findHomepage(language)
    userInvariant(homepageBase, 'homepage not found', 404)

    const templateIds = homepageBase.featuredPackTemplateId
      ? [
          ...homepageBase.upcomingPackTemplateIds,
          homepageBase.featuredPackTemplateId,
        ]
      : homepageBase.upcomingPackTemplateIds

    const packs = await this.packsService.getPublishedPacksByTemplateIds(
      templateIds
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
