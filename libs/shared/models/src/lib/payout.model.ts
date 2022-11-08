import { EntityType, PayoutSchema } from '@algomart/schemas'
import { Model } from 'objection'

import { BaseModel } from './base.model'
import { UserAccountModel } from './user-account.model'
import { UserAccountTransferModel } from '.'

export class PayoutModel extends BaseModel {
  static tableName = EntityType.Payout
  static jsonSchema = PayoutSchema

  // Props
  userId!: string
  destinationAddress?: string | null

  // Relation props
  user?: UserAccountModel
  transfer?: UserAccountTransferModel | null

  static relationMappings = () => ({
    user: {
      relation: Model.BelongsToOneRelation,
      modelClass: UserAccountModel,
      join: {
        from: 'Payout.userId',
        to: 'UserAccount.id',
      },
    },
    transfer: {
      relation: Model.BelongsToOneRelation,
      modelClass: UserAccountTransferModel,
      join: {
        from: 'Payout.id',
        to: 'UserAccountTransfer.entityId',
      },
    },
  })
}
