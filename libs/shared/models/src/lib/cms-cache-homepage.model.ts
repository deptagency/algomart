import { BaseModel } from './base.model'

export class CMSCacheHomepageModel extends BaseModel {
  static tableName = 'CmsCacheHomepage'

  id!: string
  slug!: string
  content!: string
}
