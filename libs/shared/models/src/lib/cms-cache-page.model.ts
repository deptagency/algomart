import { BaseModel } from './base.model'

export class CMSCachePageModel extends BaseModel {
  static tableName = 'CmsCachePages'

  id!: string
  slug!: string
  content!: string
}
