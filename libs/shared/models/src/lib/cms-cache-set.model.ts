import { Model } from 'objection'

export class CMSCacheSetModel extends Model {
  static tableName = 'CmsCacheSets'

  id!: string
  slug!: string
  content!: string
  createdAt!: string
  updatedAt!: string

  $beforeUpdate() {
    this.updatedAt = new Date().toISOString()
  }
}
