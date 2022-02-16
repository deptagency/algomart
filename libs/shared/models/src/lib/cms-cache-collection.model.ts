import { BaseModel } from './base.model'

export class CMSCacheCollectionModel extends BaseModel {
  static tableName = 'CmsCacheCollections'

  id!: string
  slug!: string
  content!: string
}
