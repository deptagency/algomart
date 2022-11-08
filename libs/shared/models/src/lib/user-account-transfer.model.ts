import {
  CircleCreateWalletTransferPayoutRequest,
  CircleCreateWalletTransferRequest,
  CirclePaymentErrorCode,
  CirclePayoutErrorCode,
  CircleTransferErrorCode,
  CircleTransferStatus,
  EntityType,
  UserAccountTransferSchema,
} from '@algomart/schemas'
import { invariant } from '@algomart/shared/utils'
import { Model } from 'objection'

import { BaseModel } from './base.model'
import { CollectibleModel } from './collectible.model'
import { CollectibleListingsModel } from './collectible-listings.model'
import { PackModel } from './pack.model'
import { UserAccountModel } from './user-account.model'
import { WirePayoutModel } from './wire-payout.model'

export class UserAccountTransferModel extends BaseModel {
  static tableName = EntityType.UserAccountTransfer
  static jsonSchema = UserAccountTransferSchema

  amount!: string
  balance!: number | null
  entityId!: string
  entityType!: string
  userAccountId!: string
  externalId!: string | null
  status!: CircleTransferStatus
  error!:
    | CirclePaymentErrorCode
    | CircleTransferErrorCode
    | CirclePayoutErrorCode
    | null
  errorDetails!: string | null
  circleTransferPayload!:
    | CircleCreateWalletTransferRequest
    | CircleCreateWalletTransferPayoutRequest
    | null
  creditsTransferJobCompletedAt!: string

  userAccount?: UserAccountModel
  collectible?: CollectibleModel
  listing?: CollectibleListingsModel
  pack?: PackModel
  wirePayout?: WirePayoutModel

  $beforeDelete() {
    invariant(false, 'UserAccountTransferModel records cannot be deleted')
  }

  static modifiers = {
    initialWireTransfer(query) {
      const { ref } = UserAccountTransferModel
      query.where(ref('entityType'), EntityType.WirePayout).first()
    },
    refundWireTransfer(query) {
      const { ref } = UserAccountTransferModel
      query.where(ref('entityType'), EntityType.WirePayoutFailedRefund).first()
    },
    returnWireTransfer(query) {
      const { ref } = UserAccountTransferModel
      query.where(ref('entityType'), EntityType.WirePayoutReturn).first()
    },
  }

  static relationMappings = () => ({
    userAccount: {
      relation: Model.BelongsToOneRelation,
      modelClass: UserAccountModel,
      join: {
        from: 'UserAccountTransfer.userAccountId',
        to: 'UserAccount.id',
      },
    },
    collectible: {
      relation: Model.BelongsToOneRelation,
      modelClass: CollectibleModel,
      join: {
        from: 'UserAccountTransfer.entityId',
        to: 'Collectible.id',
      },
    },
    pack: {
      relation: Model.BelongsToOneRelation,
      modelClass: PackModel,
      join: {
        from: 'UserAccountTransfer.entityId',
        to: 'Pack.id',
      },
    },
    listing: {
      relation: Model.BelongsToOneRelation,
      modelClass: CollectibleListingsModel,
      join: {
        from: 'UserAccountTransfer.entityId',
        to: 'CollectibleListings.id',
      },
    },
    wirePayout: {
      relation: Model.BelongsToOneRelation,
      modelClass: WirePayoutModel,
      join: {
        from: 'UserAccountTransfer.entityId',
        to: 'WirePayout.id',
      },
    },
  })
}
