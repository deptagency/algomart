import { DirectusCollectibleTemplate } from '@algomart/schemas'
import { Model } from 'objection'
import { CollectibleModel } from './collectible.model'

export class CMSCacheCollectibleTemplateModel extends Model {
  static tableName = 'CmsCacheCollectibleTemplates'

  id!: string
  content!: string
  createdAt!: string
  updatedAt!: string

  $beforeUpdate() {
    this.updatedAt = new Date().toISOString()
  }

  static async insert(collectibleTemplate: DirectusCollectibleTemplate) {
    await CMSCacheCollectibleTemplateModel.query().insert({
      id: collectibleTemplate.id,
      content: JSON.stringify(collectibleTemplate),
    })

    await CollectibleModel.query().insert(
      Array.from(
        { length: collectibleTemplate.total_editions },
        (_, index) => ({
          edition: index + 1,
          templateId: collectibleTemplate.id,
        })
      )
    )

    return collectibleTemplate
  }

  static async update(collectibleTemplate: DirectusCollectibleTemplate) {
    await CMSCacheCollectibleTemplateModel.query()
      .where({ id: collectibleTemplate.id })
      .update({ content: JSON.stringify(collectibleTemplate) })

    return collectibleTemplate
  }

  static async upsert(collectibleTemplate: DirectusCollectibleTemplate) {
    const record = await this.getById(collectibleTemplate.id)
    if (record) {
      this.update(collectibleTemplate)
    } else {
      this.insert(collectibleTemplate)
    }

    return collectibleTemplate
  }

  static async getById(id: string) {
    return await CMSCacheCollectibleTemplateModel.query().findOne('id', id)
  }
}
