import {
  CollectibleListingModelSchema,
  CollectibleListingStatus,
  CollectibleListingType,
  EntityType,
} from '@algomart/schemas'
import { Model } from 'objection'

import { BaseModel } from './base.model'
import { CollectibleModel } from './collectible.model'
import { UserAccountModel } from './user-account.model'

export class CollectibleListingsModel extends BaseModel {
  static tableName = EntityType.CollectibleListings
  static jsonSchema = CollectibleListingModelSchema

  collectibleId!: string
  price!: number
  type!: CollectibleListingType
  status!: CollectibleListingStatus
  sellerId!: string
  buyerId!: string | null
  claimedAt!: string | null
  purchasedAt!: string | null
  expiresAt!: string | null

  collectible?: CollectibleModel
  buyer?: UserAccountModel
  seller?: UserAccountModel

  static relationMappings = () => ({
    collectible: {
      relation: Model.BelongsToOneRelation,
      modelClass: CollectibleModel,
      join: {
        from: 'CollectibleListings.collectibleId',
        to: 'Collectible.id',
      },
    },

    seller: {
      relation: Model.BelongsToOneRelation,
      modelClass: UserAccountModel,
      join: {
        from: 'CollectibleListings.sellerId',
        to: 'UserAccount.id',
      },
    },

    buyer: {
      relation: Model.BelongsToOneRelation,
      modelClass: UserAccountModel,
      join: {
        from: 'CollectibleListings.buyerId',
        to: 'UserAccount.id',
      },
    },
  })
}
