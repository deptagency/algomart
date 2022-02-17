import { Model } from 'objection'

export class CMSCacheFaqModel extends Model {
  static tableName = 'CmsCacheFaqs'

  id!: string
  content!: string
  createdAt!: string
  updatedAt!: string

  $beforeUpdate() {
    this.updatedAt = new Date().toISOString()
  }
}
