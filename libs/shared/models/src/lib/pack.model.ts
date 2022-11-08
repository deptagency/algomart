import { EntityType, PackSchema } from '@algomart/schemas'
import { Model } from 'objection'

import { BaseModel } from './base.model'
import { BidModel } from './bid.model'
import { CMSCachePackTemplateModel } from './cms-cache-pack-template.model'
import { CollectibleModel } from './collectible.model'
import { UserAccountModel } from './user-account.model'

export class PackModel extends BaseModel {
  static tableName = EntityType.Pack
  static jsonSchema = PackSchema

  templateId!: string
  ownerId!: string | null
  claimedAt!: string | null
  redeemCode!: string | null
  activeBidId!: string | null
  expiresAt!: string | null

  owner?: UserAccountModel
  collectibles?: CollectibleModel[]
  bids?: BidModel[]
  activeBid?: BidModel
  template?: CMSCachePackTemplateModel

  static relationMappings = () => ({
    owner: {
      relation: Model.BelongsToOneRelation,
      modelClass: UserAccountModel,
      join: {
        from: 'Pack.ownerId',
        to: 'UserAccount.id',
      },
    },
    collectibles: {
      relation: Model.HasManyRelation,
      modelClass: CollectibleModel,
      join: {
        from: 'Pack.id',
        to: 'Collectible.packId',
      },
    },
    bids: {
      relation: Model.HasManyRelation,
      modelClass: BidModel,
      join: {
        from: 'Pack.id',
        to: 'Bid.packId',
      },
    },
    activeBid: {
      relation: Model.BelongsToOneRelation,
      modelClass: BidModel,
      join: {
        from: 'Pack.activeBidId',
        to: 'Bid.id',
      },
    },
    template: {
      relation: Model.BelongsToOneRelation,
      modelClass: CMSCachePackTemplateModel,
      join: {
        from: 'Pack.templateId',
        to: 'CmsCachePackTemplates.id',
      },
    },
  })
}
