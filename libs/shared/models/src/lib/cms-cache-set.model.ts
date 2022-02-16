import { BaseModel } from './base.model'

export class CMSCacheSetModel extends BaseModel {
  static tableName = 'CmsCacheSets'

  id!: string
  slug!: string
  content!: string
}
