import { AlgorandAccountSchema } from '@algomart/schemas'
import { Model } from 'objection'

import { AlgorandTransactionModel } from './algorand-transaction.model'
import { BaseModel } from './base.model'

export class AlgorandAccountModel extends BaseModel {
  static tableName = 'AlgorandAccount'
  static jsonSchema = AlgorandAccountSchema

  address!: string
  encryptedKey!: string
  creationTransactionId!: string | null

  creationTransaction?: AlgorandTransactionModel | null

  static relationMappings = () => ({
    creationTransaction: {
      relation: Model.BelongsToOneRelation,
      modelClass: AlgorandTransactionModel,
      join: {
        from: 'AlgorandAccount.creationTransactionId',
        to: 'AlgorandTransaction.id',
      },
    },
  })
}
