import { Model } from 'objection'
import { DirectusHomepage } from '@algomart/schemas'

export class CMSCacheHomepageModel extends Model {
  static tableName = 'CmsCacheHomepage'

  id!: string
  content!: string
  createdAt!: string
  updatedAt!: string

  $beforeUpdate() {
    this.updatedAt = new Date().toISOString()
  }

  static async insert(homepage: DirectusHomepage) {
    await CMSCacheHomepageModel.query().insert({
      id: homepage.id,
      content: JSON.stringify(homepage),
    })

    return homepage
  }

  static async update(homepage: DirectusHomepage) {
    await CMSCacheHomepageModel.query()
      .where({ id: homepage.id })
      .update({ content: JSON.stringify(homepage) })

    return homepage
  }

  static async upsert(homepage: DirectusHomepage) {
    const record = await this.getById(homepage.id)
    if (record) {
      this.update(homepage)
    } else {
      this.insert(homepage)
    }

    return homepage
  }

  static async getById(id: string) {
    return await CMSCacheHomepageModel.query().findOne('id', id)
  }
}
