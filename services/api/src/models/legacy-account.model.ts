import { LegacyAccountSchema } from '@algomart/schemas'
import { Model } from 'objection'

import { BaseModel } from './base.model'
import { UserAccountModel } from './user-account.model'

export class LegacyAccountModel extends BaseModel {
  static tableName = 'LegacyAccount'
  static jsonSchema = LegacyAccountSchema

  legacyEmail!: string
  newAccountId!: string | null

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
