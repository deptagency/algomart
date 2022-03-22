import { DirectusApplication } from '@algomart/schemas'
import { Model } from 'objection'

export class CMSCacheApplicationModel extends Model {
  static tableName = 'CmsCacheApplication'

  id!: string
  content!: string
  createdAt!: string
  updatedAt!: string

  $beforeUpdate() {
    this.updatedAt = new Date().toISOString()
  }

  static async insert(application: DirectusApplication) {
    await CMSCacheApplicationModel.query().insert({
      id: application.id,
      content: JSON.stringify(application),
    })

    return application
  }

  static async update(application: DirectusApplication) {
    await CMSCacheApplicationModel.query()
      .where({ id: application.id })
      .update({ content: JSON.stringify(application) })

    return application
  }

  static async upsert(application: DirectusApplication) {
    const record = await this.getById(application.id)
    if (record) {
      this.update(application)
    } else {
      this.insert(application)
    }

    return application
  }

  static async getById(id: string) {
    return await CMSCacheApplicationModel.query().findOne('id', id)
  }
}
