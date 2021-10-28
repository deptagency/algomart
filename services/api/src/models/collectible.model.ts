import { CollectibleSchema } from '@algomart/schemas'
import { Model } from 'objection'

import { AlgorandTransactionModel } from './algorand-transaction.model'
import { BaseModel } from './base.model'
import { CollectibleOwnershipModel } from './collectible-ownership.model'
import { PackModel } from './pack.model'
import { UserAccountModel } from './user-account.model'

export class CollectibleModel extends BaseModel {
  static tableName = 'Collectible'
  static jsonSchema = CollectibleSchema

  templateId!: string
  ownerId!: string | null
  claimedAt!: Date | string | null
  creationTransactionId!: string | null
  latestTransferTransactionId!: string | null
  edition!: number
  address!: number | null
  packId!: string | null

  owner?: UserAccountModel
  creationTransaction?: AlgorandTransactionModel
  latestTransferTransaction?: AlgorandTransactionModel
  ownership?: CollectibleOwnershipModel[]
  pack?: PackModel

  static relationMappings = () => ({
    owner: {
      relation: Model.BelongsToOneRelation,
      modelClass: UserAccountModel,
      join: {
        from: 'Collectible.ownerId',
        to: 'UserAccount.id',
      },
    },
    creationTransaction: {
      relation: Model.BelongsToOneRelation,
      modelClass: AlgorandTransactionModel,
      join: {
        from: 'Collectible.creationTransactionId',
        to: 'AlgorandTransaction.id',
      },
    },
    latestTransferTransaction: {
      relation: Model.BelongsToOneRelation,
      modelClass: AlgorandTransactionModel,
      join: {
        from: 'Collectible.latestTransferTransactionId',
        to: 'AlgorandTransaction.id',
      },
    },
    ownership: {
      relation: Model.HasManyRelation,
      modelClass: CollectibleOwnershipModel,
      join: {
        from: 'Collectible.id',
        to: 'CollectibleOwnership.collectibleId',
      },
    },
    pack: {
      relation: Model.BelongsToOneRelation,
      modelClass: PackModel,
      join: {
        from: 'Collectible.packId',
        to: 'Pack.id',
      },
    },
  })
}
