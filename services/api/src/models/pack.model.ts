import { PackSchema } from '@algomart/schemas'
import { Model } from 'objection'

import { BaseModel } from './base.model'
import { BidModel } from './bid.model'
import { CollectibleModel } from './collectible.model'
import { UserAccountModel } from './user-account.model'

export class PackModel extends BaseModel {
  static tableName = 'Pack'
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
  })
}
