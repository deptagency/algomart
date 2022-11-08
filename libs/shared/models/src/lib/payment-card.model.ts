import {
  CircleCardErrorCode,
  CircleCreateCard,
  EntityType,
  PaymentCardSchema,
  PaymentCardStatus,
} from '@algomart/schemas'
import { Model } from 'objection'

import { BaseModel } from './base.model'
import { UserAccountModel } from './user-account.model'

export class PaymentCardModel extends BaseModel {
  static tableName = EntityType.PaymentCard
  static jsonSchema = PaymentCardSchema

  countryCode!: string
  ownerId!: string
  network!: string
  lastFour!: string
  expirationMonth!: string
  expirationYear!: string
  externalId!: string
  status!: PaymentCardStatus | null
  error!: CircleCardErrorCode | null
  errorDetails!: string | null
  default!: boolean
  isSaved!: boolean
  payload!: CircleCreateCard | null
  idempotencyKey!: string | null

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
