import { BaseModel } from './base.model'

export class CMSCacheFaqModel extends BaseModel {
  static tableName = 'CmsCacheFaqs'

  id!: string
  slug!: string
  content!: string
}
