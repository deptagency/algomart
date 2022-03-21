import { DirectusCollection } from '@algomart/schemas'
import { Model } from 'objection'

export class CMSCacheCollectionModel extends Model {
  static tableName = 'CmsCacheCollections'

  id!: string
  slug!: string
  content!: string
  createdAt!: string
  updatedAt!: string

  $beforeUpdate() {
    this.updatedAt = new Date().toISOString()
  }

  static async insert(collection: DirectusCollection) {
    await CMSCacheCollectionModel.query().insert({
      id: collection.id,
      slug: collection.slug,
      content: JSON.stringify(collection),
    })

    return collection
  }

  static async update(collection: DirectusCollection) {
    await CMSCacheCollectionModel.query()
      .where({ id: collection.id })
      .update({ content: JSON.stringify(collection) })

    return collection
  }

  static async upsert(collection: DirectusCollection) {
    const record = await this.getById(collection.id)

    if (record) {
      this.update(collection)
    } else {
      this.insert(collection)
    }

    return collection
  }

  static async getById(id: string) {
    return await CMSCacheCollectionModel.query().findOne('id', id)
  }
}
