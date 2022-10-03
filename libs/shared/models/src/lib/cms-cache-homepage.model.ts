import { DirectusHomepage, EntityType } from '@algomart/schemas'
import { Model } from 'objection'

export class CMSCacheHomepageModel extends Model {
  static tableName = EntityType.CmsCacheHomepage

  id!: string
  content!: DirectusHomepage
  createdAt!: string
  updatedAt!: string

  $beforeUpdate() {
    this.updatedAt = new Date().toISOString()
  }

  static async insert(homepage: DirectusHomepage) {
    await CMSCacheHomepageModel.query().insert({
      id: homepage.id,
      content: homepage,
    })

    return homepage
  }

  static async update(homepage: DirectusHomepage) {
    await CMSCacheHomepageModel.query()
      .where({ id: homepage.id })
      .update({ content: homepage })

    return homepage
  }

  static async upsert(homepage: DirectusHomepage) {
    const record = await this.getById(homepage.id)
    await (record ? this.update(homepage) : this.insert(homepage))
    return homepage
  }

  static async getById(id: string) {
    return await CMSCacheHomepageModel.query().findOne('id', id)
  }
}
