import { Model } from 'objection'
import { DirectusPage } from '@algomart/schemas'

export class CMSCachePageModel extends Model {
  static tableName = 'CmsCachePages'

  id!: string
  slug!: string
  content!: string
  createdAt!: string
  updatedAt!: string

  $beforeUpdate() {
    this.updatedAt = new Date().toISOString()
  }

  static async insert(page: DirectusPage) {
    await CMSCachePageModel.query().insert({
      id: page.id,
      slug: page.slug,
      content: JSON.stringify(page),
    })

    return page
  }

  static async update(page: DirectusPage) {
    await CMSCachePageModel.query()
      .where({ id: page.id })
      .update({ content: JSON.stringify(page) })

    return page
  }

  static async upsert(page: DirectusPage) {
    const record = await this.getById(page.id)
    if (record) {
      this.update(page)
    } else {
      this.insert(page)
    }

    return page
  }

  static async getById(id: string) {
    return await CMSCachePageModel.query().findOne('id', id)
  }
}
