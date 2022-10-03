import {
  CircleBankAddress,
  CircleBillingDetails,
  CircleRiskEvaluation,
  CircleWireBankAccountStatus,
  EntityType,
  WireBankAccountSchema,
} from '@algomart/schemas'
import { Model } from 'objection'

import { BaseModel } from './base.model'
import { UserAccountModel } from './user-account.model'

export class WireBankAccountModel extends BaseModel {
  static tableName = EntityType.WireBankAccount
  static jsonSchema = WireBankAccountSchema

  // set by circle
  externalId!: string | null
  fingerprint!: string | null
  trackingRef!: string | null
  description!: string | null
  // set by us
  idempotencyKey!: string
  accountNumber!: string | null
  routingNumber!: string | null
  iban!: string | null
  ownerId!: string
  default!: boolean
  isSaved!: boolean
  billingDetails!: CircleBillingDetails
  bankAddress!: CircleBankAddress
  status!: CircleWireBankAccountStatus
  error!: string | null
  riskEvaluation!: CircleRiskEvaluation | null

  owner?: UserAccountModel

  static relationMappings = () => ({
    owner: {
      relation: Model.BelongsToOneRelation,
      modelClass: UserAccountModel,
      join: {
        from: 'WireBankAccount.ownerId',
        to: 'UserAccount.id',
      },
    },
  })
}
