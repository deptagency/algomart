import { DirectusApplication, EntityType } from '@algomart/schemas'
import { Model } from 'objection'

export class CMSCacheApplicationModel extends Model {
  static tableName = EntityType.CmsCacheApplication

  id!: string
  content!: DirectusApplication
  createdAt!: string
  updatedAt!: string

  $beforeUpdate() {
    this.updatedAt = new Date().toISOString()
  }

  static async insert(application: DirectusApplication) {
    await CMSCacheApplicationModel.query().insert({
      id: application.id,
      content: application,
    })

    return application
  }

  static async update(application: DirectusApplication) {
    await CMSCacheApplicationModel.query()
      .where({ id: application.id })
      .update({ content: application })

    return application
  }

  static async upsert(application: DirectusApplication) {
    const record = application.id
      ? await this.getById(application.id)
      : undefined
    await (record ? this.update(application) : this.insert(application))

    return application
  }

  static async getById(id: string) {
    return await CMSCacheApplicationModel.query().findOne('id', id)
  }
}
