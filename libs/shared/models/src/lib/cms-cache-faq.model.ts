import { DirectusFaqTemplate, EntityType } from '@algomart/schemas'
import { Model } from 'objection'

export class CMSCacheFaqModel extends Model {
  static tableName = EntityType.CmsCacheFaqs

  id!: string
  content!: DirectusFaqTemplate
  createdAt!: string
  updatedAt!: string

  $beforeUpdate() {
    this.updatedAt = new Date().toISOString()
  }

  static async insert(faq: DirectusFaqTemplate) {
    await CMSCacheFaqModel.query().insert({
      id: faq.id,
      content: faq,
    })

    return faq
  }

  static async update(faq: DirectusFaqTemplate) {
    await CMSCacheFaqModel.query()
      .where({ id: faq.id })
      .update({ content: faq })

    return faq
  }

  static async upsert(faq: DirectusFaqTemplate) {
    const record = await this.getById(faq.id)
    await (record ? this.update(faq) : this.insert(faq))

    return faq
  }

  static async getById(id: string) {
    return await CMSCacheFaqModel.query().findOne('id', id)
  }
}
