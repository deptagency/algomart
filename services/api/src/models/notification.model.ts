import {
  NotificationSchema,
  NotificationStatus,
  NotificationType,
} from '@algomart/schemas'
import { Model } from 'objection'

import { BaseModel } from './base.model'
import { UserAccountModel } from './user-account.model'

export class NotificationModel extends BaseModel {
  static tableName = 'Notification'
  static jsonSchema = NotificationSchema

  error!: string | null
  status!: NotificationStatus
  type!: NotificationType
  userAccountId!: string
  variables!: Record<string, boolean | number | string> | null

  userAccount?: UserAccountModel

  static relationMappings = () => ({
    userAccount: {
      relation: Model.BelongsToOneRelation,
      modelClass: UserAccountModel,
      join: {
        from: 'Notification.userAccountId',
        to: 'UserAccount.id',
      },
    },
  })
}
