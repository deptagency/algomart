import { AlgorandTransactionGroupSchema } from '@algomart/schemas'
import { Model } from 'objection'

import { AlgorandTransactionModel } from './algorand-transaction.model'
import { BaseModel } from './base.model'

export class AlgorandTransactionGroupModel extends BaseModel {
  static tableName = 'AlgorandTransactionGroup'
  static jsonSchema = AlgorandTransactionGroupSchema

  transactions?: AlgorandTransactionModel[]

  static relationMappings = () => ({
    transactions: {
      relation: Model.HasManyRelation,
      modelClass: AlgorandTransactionModel,
      join: {
        from: 'AlgorandTransactionGroup.id',
        to: 'AlgorandTransaction.groupId',
      },
    },
  })
}
