import { Model } from 'objection'

export class CMSCachePageModel extends Model {
  static tableName = 'CmsCachePages'

  id!: string
  slug!: string
  content!: string
  createdAt!: string
  updatedAt!: string

  $beforeUpdate() {
    this.updatedAt = new Date().toISOString()
  }
}
