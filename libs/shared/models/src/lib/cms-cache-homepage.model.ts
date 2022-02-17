import { Model } from 'objection'

export class CMSCacheHomepageModel extends Model {
  static tableName = 'CmsCacheHomepage'

  id!: string
  content!: string
  createdAt!: string
  updatedAt!: string

  $beforeUpdate() {
    this.updatedAt = new Date().toISOString()
  }
}
