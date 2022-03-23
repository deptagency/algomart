import { CollectibleShowcaseSchema } from '@algomart/schemas'
import { Model } from 'objection'

import { BaseModel } from './base.model'
import { CollectibleModel } from './collectible.model'
import { UserAccountModel } from './user-account.model'

export class CollectibleShowcaseModel extends BaseModel {
  static tableName = 'CollectibleShowcase'
  static jsonSchema = CollectibleShowcaseSchema

  ownerId!: string
  collectibleId!: string
  order!: number

  owner?: UserAccountModel
  collectible?: CollectibleModel

  static relationMappings = () => ({
    owner: {
      relation: Model.BelongsToOneRelation,
      modelClass: UserAccountModel,
      join: {
        from: 'CollectibleShowcase.ownerId',
        to: 'UserAccount.id',
      },
    },
    collectible: {
      relation: Model.BelongsToOneRelation,
      modelClass: CollectibleModel,
      join: {
        from: 'CollectibleShowcase.collectibleId',
        to: 'Collectible.id',
      },
    },
  })
}
