import { Model } from 'objection'

export class CMSCacheCollectibleTemplateModel extends Model {
  static tableName = 'CmsCacheCollectibleTemplates'

  id!: string
  content!: string
  createdAt!: string
  updatedAt!: string

  $beforeUpdate() {
    this.updatedAt = new Date().toISOString()
  }
}
