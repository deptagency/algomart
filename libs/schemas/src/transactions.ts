import { Static, Type } from '@sinclair/typebox'
import { TransactionType } from 'algosdk'

import {
  AlgorandAccountAddressPattern,
  Base64Schema,
  BaseSchema,
  Nullable,
  regExpToString,
  Simplify,
} from './shared'

export enum AlgorandTransactionStatus {
  Unsigned = 'unsigned',
  Signed = 'signed',
  Submitting = 'submitting',
  Pending = 'pending',
  Failed = 'failed',
  Confirmed = 'confirmed',
}

export const AlgorandTransactionAddressPattern = /^[2-7A-Z]{52}$/

export const AlgorandTransactionParameterSchema = Type.Object({
  txID: Type.String(),
})

export const AlgorandAssetIndexParameterSchema = Type.Object({
  assetIndex: Type.Number(),
})

export const AlgorandTransactionSchema = Type.Intersect([
  BaseSchema,
  Type.Object({
    // Algorand Transaction ID (address) is a 52 character long Base 32 (RFC 4648) string
    address: Type.String({
      maxLength: 52,
      minLength: 52,
      pattern: regExpToString(AlgorandTransactionAddressPattern),
    }),
    error: Type.Optional(Nullable(Type.String())),
    groupId: Type.Optional(Nullable(Type.String({ format: 'uuid' }))),
    status: Type.Optional(Type.Enum(AlgorandTransactionStatus)),
    encodedSignedTransaction: Type.Optional(Type.String()),
    encodedTransaction: Type.Optional(Type.String()),
    signer: Type.Optional(
      Type.String({
        maxLength: 58,
        minLength: 58,
        pattern: regExpToString(AlgorandAccountAddressPattern),
      })
    ),
  }),
])

export const AlgorandTransformedAssetInfoSchema = Type.Object({
  address: Type.Number(),
  creator: Type.String(),
  unitName: Type.String(),
  isFrozen: Type.Optional(Type.Boolean()),
  decimals: Type.Integer(),
  defaultFrozen: Type.Boolean(),
  url: Type.Optional(Type.String()),
  name: Type.Optional(Type.String()),
})

export const AlgorandTransformedPendingTransactionInfoSchema = Type.Object({
  applicationIndex: Type.Number(),
  assetClosingAmount: Type.Number(),
  assetIndex: Type.Number(),
  closeRewards: Type.Number(),
  confirmedRound: Type.Number(),
  globalStateDelta: Type.Array(Type.Record(Type.String(), Type.Unknown())),
  innerTxns: Type.Array(Type.Record(Type.String(), Type.Unknown())),
  localStateDelta: Type.Array(Type.Record(Type.String(), Type.Unknown())),
  poolError: Type.String(),
  receiverRewards: Type.Number(),
  senderRewards: Type.Number(),
  txn: Type.Record(Type.String(), Type.Unknown()),
  txID: Type.String(),
})

export const AlgorandTransformedTransactionInfoSchema = Type.Object({
  applicationTransaction: Type.Optional(
    Type.Record(Type.String(), Type.Unknown())
  ),
  assetConfigTransaction: Type.Optional(
    Type.Record(Type.String(), Type.Unknown())
  ),
  assetFreezeTransaction: Type.Optional(
    Type.Record(Type.String(), Type.Unknown())
  ),
  assetTransferTransaction: Type.Optional(
    Type.Record(Type.String(), Type.Unknown())
  ),
  authAddr: Type.Optional(Type.String()),
  closeRewards: Type.Optional(Type.Integer()),
  closingAmount: Type.Optional(Type.Integer()),
  confirmedRound: Type.Optional(Type.Integer()),
  createdApplicationIndex: Type.Optional(Type.Integer()),
  createdAssetIndex: Type.Optional(Type.Integer()),
  fee: Type.Optional(Type.Integer()),
  firstValid: Type.Integer(),
  genesisHash: Type.Optional(Base64Schema),
  genesisId: Type.String(),
  globalStateDelta: Type.Optional(Type.Record(Type.String(), Type.Unknown())),
  group: Base64Schema,
  id: Type.String(),
  innerTxns: Type.Optional(
    Type.Array(Type.Record(Type.String(), Type.Unknown()))
  ),
  intraRoundOffset: Type.Optional(Type.Integer()),
  keyRegTransaction: Type.Optional(Type.Record(Type.String(), Type.Unknown())),
  lastValid: Type.Integer(),
  lease: Type.Optional(Base64Schema),
  localStateDelta: Type.Optional(
    Type.Array(Type.Record(Type.String(), Type.Unknown()))
  ),
  logs: Type.Optional(Type.Array(Type.String())),
  note: Type.Optional(Base64Schema),
  paymentTransaction: Type.Optional(Type.Record(Type.String(), Type.Unknown())),
  receiverRewards: Type.Optional(Type.Integer()),
  rekeyTo: Type.Optional(Type.String()),
  roundTime: Type.Optional(Type.Integer()),
  sender: Type.String(),
  senderRewards: Type.Optional(Type.Integer()),
  signature: Type.Optional(Type.Record(Type.String(), Type.Unknown())),
  txType: Type.Enum(TransactionType),
})

export const AlgorandTransactionSuggestedParamsSchema = Type.Object({
  fee: Type.Number(),
  flatFee: Type.Optional(Type.Boolean()),
  firstRound: Type.Number(),
  lastRound: Type.Number(),
  genesisHash: Base64Schema,
  genesisID: Type.String(),
})

export const AlgorandSendRawTransactionSchema = Type.Union([
  Type.Uint8Array(),
  Type.Array(Type.Uint8Array()),
])
export const AlgorandTransactionGroupSchema = Type.Intersect([BaseSchema])
export const AlgorandSendRawTransactionParamsSchema = Type.Object({
  transaction: AlgorandSendRawTransactionSchema,
})

export type AlgorandTransaction = Simplify<
  Static<typeof AlgorandTransactionSchema>
>
export type AlgorandTransactionGroup = Simplify<
  Static<typeof AlgorandTransactionGroupSchema>
>
export type AlgorandAssetIndexParameter = Simplify<
  Static<typeof AlgorandAssetIndexParameterSchema>
>
export type AlgorandSendRawTransaction = Simplify<
  Static<typeof AlgorandSendRawTransactionSchema>
>
export type AlgorandSendRawTransactionParams = Simplify<
  Static<typeof AlgorandSendRawTransactionParamsSchema>
>
export type AlgorandSuggestedParams = Simplify<
  Static<typeof AlgorandTransactionSuggestedParamsSchema>
>
export type AlgorandTransactionParameter = Simplify<
  Static<typeof AlgorandTransactionParameterSchema>
>
export type AlgorandTransformedAssetInfo = Simplify<
  Static<typeof AlgorandTransformedAssetInfoSchema>
>
export type AlgorandTransformedTransactionInfo = Simplify<
  Static<typeof AlgorandTransformedTransactionInfoSchema>
>
export type AlgorandTransformedPendingTransactionInfo = Simplify<
  Static<typeof AlgorandTransformedPendingTransactionInfoSchema>
>
