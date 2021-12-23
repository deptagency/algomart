import { LegacyAccountSchema } from '@algomart/schemas'
import { Model } from 'objection'

import { UserAccountModel } from './user-account.model'
// import { BaseModel } from './base.model'

export class LegacyAccountModel extends Model {
  static tableName = 'LegacyAccount'
  static jsonSchema = LegacyAccountSchema

  id!: string
  legacyEmail!: string

  newAccount?: UserAccountModel

  static relationMappings = () => ({
    newAccount: {
      relation: Model.BelongsToOneRelation,
      modelClass: UserAccountModel,
      join: {
        from: 'LegacyAccount.newAccountId',
        to: 'UserAccount.id',
      },
    },
  })
}
