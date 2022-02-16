import { BaseModel } from './base.model'

export class CMSCachePackTemplateModel extends BaseModel {
  static tableName = 'CmsCachePackTemplates'

  id!: string
  slug!: string
  type!: string
  releasedAt!: string | null
  content!: string
}
