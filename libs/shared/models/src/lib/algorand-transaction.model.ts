import {
  AlgorandTransactionSchema,
  AlgorandTransactionStatus,
  EntityType,
} from '@algomart/schemas'
import { Model } from 'objection'

import { AlgorandTransactionGroupModel } from './algorand-transaction-group.model'
import { BaseModel } from './base.model'

export class AlgorandTransactionModel extends BaseModel {
  static tableName = EntityType.AlgorandTransaction
  static jsonSchema = AlgorandTransactionSchema

  static modifiers = {
    orderAscByOrderField: (qb) => {
      qb.orderBy('order', 'asc')
    },
  }

  address!: string
  status!: AlgorandTransactionStatus
  groupId!: string | null
  error!: string | null
  encodedTransaction!: string | null
  encodedSignedTransaction!: string | null
  order!: number | null
  signer!: string | null

  group?: AlgorandTransactionGroupModel

  $beforeInsert() {
    super.$beforeInsert()
    if (!this.status) {
      this.status = AlgorandTransactionStatus.Pending
    }
  }

  static relationMappings = () => ({
    group: {
      relation: Model.BelongsToOneRelation,
      modelClass: AlgorandTransactionGroupModel,
      join: {
        from: 'AlgorandTransaction.groupId',
        to: 'AlgorandTransactionGroup.id',
      },
    },
  })
}
