import { DirectusSet, EntityType } from '@algomart/schemas'
import { Model } from 'objection'

export class CMSCacheSetModel extends Model {
  static tableName = EntityType.CmsCacheSets

  id!: string
  slug!: string
  content!: DirectusSet
  createdAt!: string
  updatedAt!: string

  $beforeUpdate() {
    this.updatedAt = new Date().toISOString()
  }

  static async insert(set: DirectusSet) {
    await CMSCacheSetModel.query().insert({
      id: set.id,
      slug: set.slug,
      content: set,
    })

    return set
  }

  static async update(set: DirectusSet) {
    await CMSCacheSetModel.query()
      .where({ id: set.id })
      .update({ content: set })

    return set
  }

  static async upsert(set: DirectusSet) {
    const record = await this.getById(set.id)
    await (record ? this.update(set) : this.insert(set))

    return set
  }

  static async getById(id: string) {
    return await CMSCacheSetModel.query().findOne('id', id)
  }
}
