import { CollectibleAuctionBidSchema, EntityType } from '@algomart/schemas'
import { Model } from 'objection'

import { AlgorandTransactionModel } from './algorand-transaction.model'
import { BaseModel } from './base.model'
import { CollectibleAuctionModel } from './collectible-auction.model'
import { UserAccountModel } from './user-account.model'

export class CollectibleAuctionBidModel extends BaseModel {
  static tableName = EntityType.CollectibleAuctionBid
  static jsonSchema = CollectibleAuctionBidSchema

  amount!: number
  collectibleAuctionId!: string
  transactionId!: string | null
  userAccountId!: string

  collectibleAuction?: CollectibleAuctionModel
  transaction?: AlgorandTransactionModel
  userAccount?: UserAccountModel

  static relationMappings = () => ({
    collectibleAuction: {
      relation: Model.BelongsToOneRelation,
      modelClass: CollectibleAuctionModel,
      join: {
        from: 'CollectibleAuctionBid.collectibleAuctionId',
        to: 'CollectibleAuction.id',
      },
    },
    transaction: {
      relation: Model.BelongsToOneRelation,
      modelClass: AlgorandTransactionModel,
      join: {
        from: 'CollectibleAuctionBid.transactionId',
        to: 'AlgorandTransaction.id',
      },
    },
    userAccount: {
      relation: Model.BelongsToOneRelation,
      modelClass: UserAccountModel,
      join: {
        from: 'CollectibleAuctionBid.userAccountId',
        to: 'UserAccount.id',
      },
    },
  })
}
