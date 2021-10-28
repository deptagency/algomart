import { BidSchema } from '@algomart/schemas'
import { Model } from 'objection'

import { BaseModel } from './base.model'
import { PackModel } from './pack.model'
import { UserAccountModel } from './user-account.model'

export class BidModel extends BaseModel {
  static tableName = 'Bid'
  static jsonSchema = BidSchema

  amount!: number
  packId!: string | null
  userAccountId!: string | null

  pack?: PackModel
  userAccount?: UserAccountModel

  static relationMappings = () => ({
    pack: {
      relation: Model.BelongsToOneRelation,
      modelClass: UserAccountModel,
      join: {
        from: 'Bid.packId',
        to: 'Pack.id',
      },
    },
    userAccount: {
      relation: Model.BelongsToOneRelation,
      modelClass: UserAccountModel,
      join: {
        from: 'Bid.userAccountId',
        to: 'UserAccount.id',
      },
    },
  })
}
