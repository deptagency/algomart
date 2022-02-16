import { BaseModel } from './base.model'

export class CMSCacheCollectibleTemplateModel extends BaseModel {
  static tableName = 'CmsCacheCollectibleTemplates'

  id!: string
  slug!: string
  content!: string
}
