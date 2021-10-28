import { UserAccountSchema } from '@algomart/schemas'
import { Model } from 'objection'

import { AlgorandAccountModel } from './algorand-account.model'
import { BaseModel } from './base.model'

export class UserAccountModel extends BaseModel {
  static tableName = 'UserAccount'
  static jsonSchema = UserAccountSchema

  username!: string
  email!: string
  locale!: string
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
