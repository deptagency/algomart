import {
  CollectibleBase,
  DEFAULT_LOCALE,
  Homepage,
  PublishedPack,
} from '@algomart/schemas'

import CollectiblesService from '../collectibles/collectibles.service'
import PacksService from '../packs/packs.service'

import DirectusAdapter from '@/lib/directus-adapter'
import { userInvariant } from '@/utils/invariant'

export default class HomepageService {
  constructor(
    private readonly cms: DirectusAdapter,
    private readonly packsService: PacksService,
    private readonly collectiblesService: CollectiblesService
  ) {}

  async getHomepage(locale = DEFAULT_LOCALE): Promise<Homepage> {
    const homepageBase = await this.cms.findHomepage()
    userInvariant(homepageBase, 'homepage not found', 404)

    const { packs } = await this.packsService.getPublishedPacks({
      locale,
      pageSize: 1 + homepageBase.upcomingPackTemplateIds.length,
      templateIds: homepageBase.featuredPackTemplateId
        ? [
            ...homepageBase.upcomingPackTemplateIds,
            homepageBase.featuredPackTemplateId,
          ]
        : homepageBase.upcomingPackTemplateIds,
    })

    const collectibles = await this.collectiblesService.getCollectibleTemplates(
      {
        locale,
        pageSize: 1 + homepageBase.notableCollectibleTemplateIds.length,
        templateIds: homepageBase.notableCollectibleTemplateIds,
      }
    )

    const packLookup = new Map(packs.map((pack) => [pack.templateId, pack]))
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
