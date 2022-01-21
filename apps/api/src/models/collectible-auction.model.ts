import {
  CollectibleAuctionSchema,
  CollectibleAuctionStatus,
} from '@algomart/schemas'
import { Model } from 'objection'

import { AlgorandTransactionModel } from './algorand-transaction.model'
import { BaseModel } from './base.model'
import { CollectibleModel } from './collectible.model'
import { CollectibleAuctionBidModel } from './collectible-auction-bid.model'
import { UserAccountModel } from './user-account.model'

export class CollectibleAuctionModel extends BaseModel {
  static tableName = 'CollectibleAuction'
  static jsonSchema = CollectibleAuctionSchema

  appId!: number
  collectibleId!: string
  endAt!: string
  reservePrice!: number
  startAt!: string
  status!: CollectibleAuctionStatus
  transactionId!: string
  userAccountId!: string

  bids?: CollectibleAuctionBidModel[]
  collectible?: CollectibleModel
  transaction?: AlgorandTransactionModel
  userAccount?: UserAccountModel

  static relationMappings = () => ({
    collectible: {
      relation: Model.BelongsToOneRelation,
      modelClass: CollectibleModel,
      join: {
        from: 'CollectibleAuction.collectibleId',
        to: 'Collectible.id',
      },
    },
    transaction: {
      relation: Model.BelongsToOneRelation,
      modelClass: AlgorandTransactionModel,
      join: {
        from: 'CollectibleAuction.transactionId',
        to: 'AlgorandTransaction.id',
      },
    },
    userAccount: {
      relation: Model.BelongsToOneRelation,
      modelClass: UserAccountModel,
      join: {
        from: 'CollectibleAuction.userAccountId',
        to: 'UserAccount.id',
      },
    },
    bids: {
      relation: Model.HasManyRelation,
      modelClass: CollectibleAuctionBidModel,
      join: {
        from: 'CollectibleAuction.id',
        to: 'CollectibleAuctionBid.collectibleAuctionId',
      },
    },
  })
}
