import { Knex } from 'knex'

import {
  CollectibleBase,
  DEFAULT_LOCALE,
  Homepage,
  PublishedPack,
} from '@algomart/schemas'
import { DirectusAdapter } from '@algomart/shared/adapters'
import { userInvariant } from '@algomart/shared/utils'

import PacksService from './packs.service'
import CollectiblesService from './collectibles.service'
import { Transaction } from 'objection'

export default class HomepageService {
  constructor(
    private readonly cms: DirectusAdapter,
    private readonly packsService: PacksService,
    private readonly collectiblesService: CollectiblesService
  ) {}

  async getHomepage(
    trx?: Transaction,
    knexRead?: Knex,
    locale = DEFAULT_LOCALE
  ): Promise<Homepage> {
    const homepageBase = await this.cms.findHomepage()
    userInvariant(homepageBase, 'homepage not found', 404)

    const { packs } = await this.packsService.getPublishedPacks(
      {
        locale,
        pageSize: 1 + homepageBase.upcomingPackTemplateIds.length,
        templateIds: homepageBase.featuredPackTemplateId
          ? [
              ...homepageBase.upcomingPackTemplateIds,
              homepageBase.featuredPackTemplateId,
            ]
          : homepageBase.upcomingPackTemplateIds,
      },
      trx,
      knexRead
    )

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
