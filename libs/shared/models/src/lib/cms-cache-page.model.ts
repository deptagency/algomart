import { DirectusPage, EntityType } from '@algomart/schemas'
import { Model } from 'objection'

export class CMSCachePageModel extends Model {
  static tableName = EntityType.CmsCachePages

  id!: string
  slug!: string
  content!: DirectusPage
  createdAt!: string
  updatedAt!: string

  $beforeUpdate() {
    this.updatedAt = new Date().toISOString()
  }

  static async insert(page: DirectusPage) {
    await CMSCachePageModel.query().insert({
      id: page.id,
      slug: page.slug,
      content: page,
    })

    return page
  }

  static async update(page: DirectusPage) {
    await CMSCachePageModel.query()
      .where({ id: page.id })
      .update({ content: page })

    return page
  }

  static async upsert(page: DirectusPage) {
    const record = await this.getById(page.id)
    await (record ? this.update(page) : this.insert(page))

    return page
  }

  static async getById(id: string) {
    return await CMSCachePageModel.query().findOne('id', id)
  }
}
