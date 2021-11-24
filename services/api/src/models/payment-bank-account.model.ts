import {
  PaymentBankAccountSchema,
  PaymentBankAccountStatus,
} from '@algomart/schemas'
import { Model } from 'objection'

import { BaseModel } from './base.model'
import { PackModel } from './pack.model'
import { PaymentModel } from './payment.model'
import { UserAccountModel } from './user-account.model'

export class PaymentBankAccountModel extends BaseModel {
  static tableName = 'PaymentBankAccount'
  static jsonSchema = PaymentBankAccountSchema

  amount!: number
  externalId!: string
  packId!: string
  status!: PaymentBankAccountStatus
  ownerId!: string

  paymentId?: string
  pack?: PackModel
  payment?: PaymentModel
  owner?: UserAccountModel

  static relationMappings = () => ({
    owner: {
      relation: Model.BelongsToOneRelation,
      modelClass: UserAccountModel,
      join: {
        from: 'PaymentBankAccount.ownerId',
        to: 'UserAccount.id',
      },
    },
  })
}
