import {
  AlgorandTransactionGroupSchema,
  AlgorandTransactionStatus,
} from '@algomart/schemas'
import { Model } from 'objection'

import { AlgorandTransactionGroupModel } from './algorand-transaction-group.model'
import { BaseModel } from './base.model'

export { AlgorandTransactionStatus }

export class AlgorandTransactionModel extends BaseModel {
  static tableName = 'AlgorandTransaction'
  static jsonSchema = AlgorandTransactionGroupSchema

  address!: string
  status!: AlgorandTransactionStatus
  groupId!: string | null
  error!: string | null

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
