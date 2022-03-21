import { DirectusSet } from '@algomart/schemas'
import { Model } from 'objection'

export class CMSCacheSetModel extends Model {
  static tableName = 'CmsCacheSets'

  id!: string
  slug!: string
  content!: string
  createdAt!: string
  updatedAt!: string

  $beforeUpdate() {
    this.updatedAt = new Date().toISOString()
  }

  static async insert(set: DirectusSet) {
    await CMSCacheSetModel.query().insert({
      id: set.id,
      slug: set.slug,
      content: JSON.stringify(set),
    })

    return set
  }

  static async update(set: DirectusSet) {
    await CMSCacheSetModel.query()
      .where({ id: set.id })
      .update({ content: JSON.stringify(set) })

    return set
  }

  static async upsert(set: DirectusSet) {
    const record = await this.getById(set.id)
    if (record) {
      this.update(set)
    } else {
      this.insert(set)
    }

    return set
  }

  static async getById(id: string) {
    return await CMSCacheSetModel.query().findOne('id', id)
  }
}
