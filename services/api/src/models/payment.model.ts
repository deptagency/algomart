import { PaymentSchema, PaymentStatus } from '@algomart/schemas'
import { Model } from 'objection'

import { BaseModel } from './base.model'
import { PackModel } from './pack.model'
import { UserAccountModel } from './user-account.model'

export class PaymentModel extends BaseModel {
  static tableName = 'Payment'
  static jsonSchema = PaymentSchema

  payerId!: string
  packId!: string | null
  externalId!: string
  paymentCardId!: string | null
  status!: PaymentStatus | null
  error!: string | null

  payer?: UserAccountModel
  pack?: PackModel

  static relationMappings = () => ({
    payer: {
      relation: Model.BelongsToOneRelation,
      modelClass: UserAccountModel,
      join: {
        from: 'Payment.payerId',
        to: 'UserAccount.id',
      },
    },
    pack: {
      relation: Model.BelongsToOneRelation,
      modelClass: PackModel,
      join: {
        from: 'Payment.packId',
        to: 'Pack.id',
      },
    },
  })
}
