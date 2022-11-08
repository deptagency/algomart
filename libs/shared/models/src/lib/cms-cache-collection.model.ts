import { DirectusCollection, EntityType } from '@algomart/schemas'
import { Model } from 'objection'

export class CMSCacheCollectionModel extends Model {
  static tableName = EntityType.CmsCacheCollections

  id!: string
  slug!: string
  content!: DirectusCollection
  createdAt!: string
  updatedAt!: string

  $beforeUpdate() {
    this.updatedAt = new Date().toISOString()
  }

  static async insert(collection: DirectusCollection) {
    await CMSCacheCollectionModel.query().insert({
      id: collection.id,
      slug: collection.slug,
      content: collection,
    })

    return collection
  }

  static async update(collection: DirectusCollection) {
    await CMSCacheCollectionModel.query()
      .where({ id: collection.id })
      .update({ content: collection })

    return collection
  }

  static async upsert(collection: DirectusCollection) {
    const record = await this.getById(collection.id)
    await (record ? this.update(collection) : this.insert(collection))

    return collection
  }

  static async getById(id: string) {
    return await CMSCacheCollectionModel.query().findOne('id', id)
  }
}
