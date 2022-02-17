import { Model } from 'objection'

export class CMSCacheLanguageModel extends Model {
  static tableName = 'CmsCacheLanguages'

  code!: string
  content!: string
  createdAt!: string
  updatedAt!: string

  $beforeUpdate() {
    this.updatedAt = new Date().toISOString()
  }
}
