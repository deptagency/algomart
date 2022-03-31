import { UserAccountSchema } from '@algomart/schemas'
import { Model } from 'objection'

import { AlgorandAccountModel } from './algorand-account.model'
import { BaseModel } from './base.model'

export class UserAccountModel extends BaseModel {
  static tableName = 'UserAccount'
  static jsonSchema = UserAccountSchema

  currency!: string
  username!: string
  email!: string
  language!: string
  algorandAccountId!: string
  externalId!: string
  showProfile!: boolean

  algorandAccount?: AlgorandAccountModel

  static relationMappings = () => ({
    algorandAccount: {
      relation: Model.BelongsToOneRelation,
      modelClass: AlgorandAccountModel,
      join: {
        from: 'UserAccount.algorandAccountId',
        to: 'AlgorandAccount.id',
      },
    },
  })
}
