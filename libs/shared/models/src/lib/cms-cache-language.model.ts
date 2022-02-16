import { BaseModel } from './base.model'

export class CMSCacheLanguageModel extends BaseModel {
  static tableName = 'CmsCacheLanguage'

  id!: string
  slug!: string
  content!: string
}
