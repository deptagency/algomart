import { EventAction, EventEntityType, EventSchema } from '@algomart/schemas'
import { Model } from 'objection'

import { BaseModel } from './base.model'
import { UserAccountModel } from './user-account.model'

export class EventModel extends BaseModel {
  static tableName = 'Event'
  static jsonSchema = EventSchema

  action!: EventAction
  entityType!: EventEntityType
  entityId!: string
  userAccountId!: string | null

  userAccount?: UserAccountModel

  static relationMappings = () => ({
    userAccount: {
      relation: Model.BelongsToOneRelation,
      modelClass: UserAccountModel,
      join: {
        from: 'Event.userAccountId',
        to: 'UserAccount.id',
      },
    },
  })
}
