import {
  PaymentBankAccountSchema,
  PaymentBankAccountStatus,
} from '@algomart/schemas'
import { Model } from 'objection'

import { BaseModel } from './base.model'
import { UserAccountModel } from './user-account.model'

export class PaymentBankAccountModel extends BaseModel {
  static tableName = 'PaymentBankAccount'
  static jsonSchema = PaymentBankAccountSchema

  amount!: number
  externalId!: string
  description!: string
  status!: PaymentBankAccountStatus
  ownerId!: string

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
