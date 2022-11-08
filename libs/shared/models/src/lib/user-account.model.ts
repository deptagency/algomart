import {
  EntityType,
  UserAccountProvider,
  UserAccountSchema,
  UserAccountStatus,
  WatchlistBreakdown,
} from '@algomart/schemas'
import { Model } from 'objection'

import { AlgorandAccountModel } from './algorand-account.model'
import { BaseModel } from './base.model'

export class UserAccountModel extends BaseModel {
  static tableName = EntityType.UserAccount
  static jsonSchema = UserAccountSchema

  age!: number | null
  algorandAccountId!: string
  balance!: number
  currency!: string
  email!: string
  externalId!: string
  externalWalletId!: string | null
  circleWalletCreationIdempotencyKey!: string | null
  applicantId!: string | null
  lastWorkflowRunId!: string | null
  lastVerified!: string | null
  verificationStatus!: UserAccountStatus
  recentWatchlistBreakdown!: WatchlistBreakdown | null
  language!: string
  marketingOptIn!: boolean | null
  provider!: UserAccountProvider | null
  showProfile!: boolean
  username!: string
  countryCode!: string | null
  watchlistMonitorId!: string | null

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
