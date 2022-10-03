import {
  AlgorandTransaction,
  CirclePaymentErrorCode,
  CircleTransferErrorCode,
  CreateCcPayment,
  EntityType,
  PaymentItem,
  PaymentSchema,
  PaymentStatus,
} from '@algomart/schemas'
import { Model } from 'objection'

import { AlgorandTransactionModel } from './algorand-transaction.model'
import { BaseModel } from './base.model'
import { PaymentCardModel } from './payment-card.model'
import { UserAccountModel } from './user-account.model'
import { UserAccountTransferModel } from './user-account-transfer.model'

export class PaymentModel extends BaseModel {
  static tableName = EntityType.Payment
  static jsonSchema = PaymentSchema

  payerId!: string
  paymentCardId?: string | null
  externalId!: string | null
  status!: PaymentStatus | null
  error!: CirclePaymentErrorCode | CircleTransferErrorCode | null
  errorDetails!: string | null
  action!: string | null
  amount!: string
  itemId?: string | null
  itemType?: PaymentItem
  fees!: string
  total!: string
  payload!: Omit<
    CreateCcPayment,
    'userExternalId' | 'cardId' | 'countryCode'
  > | null
  retryPayload!: Omit<
    CreateCcPayment,
    'userExternalId' | 'cardId' | 'countryCode'
  > | null
  retryExternalId!: string | null
  idempotencyKey!: string | null
  retryIdempotencyKey!: string | null
  usdcDepositAlgorandTransactionId!: string | null

  destinationAddress?: string | null
  transferId?: string | null
  payer?: UserAccountModel
  paymentCard?: PaymentCardModel | null
  usdcDepositAlgorandTransaction?: AlgorandTransaction | null

  static relationMappings = () => ({
    payer: {
      relation: Model.BelongsToOneRelation,
      modelClass: UserAccountModel,
      join: {
        from: 'Payment.payerId',
        to: 'UserAccount.id',
      },
    },
    transfer: {
      relation: Model.BelongsToOneRelation,
      modelClass: UserAccountTransferModel,
      join: {
        from: 'Payment.id',
        to: 'UserAccountTransfer.entityId',
      },
    },
    paymentCard: {
      relation: Model.BelongsToOneRelation,
      modelClass: PaymentCardModel,
      join: {
        from: 'Payment.paymentCardId',
        to: 'PaymentCard.id',
      },
    },
    usdcDepositAlgorandTransaction: {
      relation: Model.BelongsToOneRelation,
      modelClass: AlgorandTransactionModel,
      join: {
        from: 'Payment.usdcDepositAlgorandTransactionId',
        to: 'AlgorandTransaction.id',
      },
    },
  })
}
