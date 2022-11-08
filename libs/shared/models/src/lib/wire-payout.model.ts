import {
  CircleCreateWirePayoutRequest,
  CircleMoneyObject,
  CirclePayoutDestination,
  CirclePayoutStatus,
  CircleReturn,
  CircleRiskEvaluation,
  EntityType,
  WirePayoutSchema,
} from '@algomart/schemas'
import { Model } from 'objection'

import { BaseModel } from './base.model'
import { UserAccountModel } from './user-account.model'
import { UserAccountTransferModel, WireBankAccountModel } from '.'

export class WirePayoutModel extends BaseModel {
  static tableName = EntityType.WirePayout
  static jsonSchema = WirePayoutSchema

  // Internal
  userId!: string
  wireBankAccountId!: string
  createPayload!: CircleCreateWirePayoutRequest
  externalId?: string | null

  // Circle
  trackingRef!: string | null
  externalRef!: string | null
  sourceWalletId!: string | null
  destination!: CirclePayoutDestination | null
  amount!: CircleMoneyObject | null
  fees!: CircleMoneyObject | null
  riskEvaluation!: CircleRiskEvaluation | null
  return!: CircleReturn | null
  status!: CirclePayoutStatus
  error!: string | null

  // Relation props
  user?: UserAccountModel
  wireBankAccount?: WireBankAccountModel
  transfers?: UserAccountTransferModel[] | null

  static relationMappings = () => ({
    user: {
      relation: Model.BelongsToOneRelation,
      modelClass: UserAccountModel,
      join: {
        from: 'WirePayout.userId',
        to: 'UserAccount.id',
      },
    },
    wireBankAccount: {
      relation: Model.BelongsToOneRelation,
      modelClass: UserAccountTransferModel,
      join: {
        from: 'WirePayout.wireBankAccountId',
        to: 'WireBankAccount.id',
      },
    },
    transfers: {
      relation: Model.HasManyRelation,
      modelClass: UserAccountTransferModel,
      join: {
        from: 'WirePayout.id',
        to: 'UserAccountTransfer.entityId',
      },
    },
  })
}
