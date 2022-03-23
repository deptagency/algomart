import { PaymentCardSchema, PaymentCardStatus } from '@algomart/schemas'
import { Model } from 'objection'

import { BaseModel } from './base.model'
import { UserAccountModel } from './user-account.model'

export class PaymentCardModel extends BaseModel {
  static tableName = 'PaymentCard'
  static jsonSchema = PaymentCardSchema

  ownerId!: string
  network!: string
  lastFour!: string
  expirationMonth!: string
  expirationYear!: string
  externalId!: string
  status!: PaymentCardStatus | null
  error!: string | null
  default!: boolean

  owner?: UserAccountModel

  static relationMappings = () => ({
    owner: {
      relation: Model.BelongsToOneRelation,
      modelClass: UserAccountModel,
      join: {
        from: 'PaymentCard.ownerId',
        to: 'UserAccount.id',
      },
    },
  })
}
