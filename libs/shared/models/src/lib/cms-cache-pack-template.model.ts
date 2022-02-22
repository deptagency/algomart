import { Model } from 'objection'

export class CMSCachePackTemplateModel extends Model {
  static tableName = 'CmsCachePackTemplates'

  id!: string
  slug!: string
  type!: string
  content!: string
  releasedAt!: string | null
  auctionUntil!: string | null
  createdAt!: string
  updatedAt!: string

  $beforeUpdate() {
    this.updatedAt = new Date().toISOString()
  }
}
