import { Model } from 'objection'

export class CMSCacheCollectionModel extends Model {
  static tableName = 'CmsCacheCollections'

  id!: string
  slug!: string
  content!: string
  createdAt!: string
  updatedAt!: string

  $beforeUpdate() {
    this.updatedAt = new Date().toISOString()
  }
}
