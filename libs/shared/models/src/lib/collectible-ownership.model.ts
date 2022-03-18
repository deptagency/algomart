import { CollectibleOwnershipSchema } from '@algomart/schemas'
import { Model } from 'objection'

import { BaseModel } from './base.model'
import { CollectibleModel } from './collectible.model'
import { UserAccountModel } from './user-account.model'

export class CollectibleOwnershipModel extends BaseModel {
  static tableName = 'CollectibleOwnership'
  static jsonSchema = CollectibleOwnershipSchema

  ownerId!: string
  collectibleId!: string

  owner?: UserAccountModel
  collectible?: CollectibleModel

  static relationMappings = () => ({
    owner: {
      relation: Model.BelongsToOneRelation,
      modelClass: UserAccountModel,
      join: {
        from: 'CollectibleOwnership.ownerId',
        to: 'UserAccount.id',
      },
    },
    collectible: {
      relation: Model.BelongsToOneRelation,
      modelClass: CollectibleModel,
      join: {
        from: 'CollectibleOwnership.collectibleId',
        to: 'Collectible.id',
      },
    },
  })
}
