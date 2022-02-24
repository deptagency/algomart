import { Model } from 'objection'
import { DirectusFaqTemplate } from '@algomart/schemas'

export class CMSCacheFaqModel extends Model {
  static tableName = 'CmsCacheFaqs'

  id!: string
  content!: string
  createdAt!: string
  updatedAt!: string

  $beforeUpdate() {
    this.updatedAt = new Date().toISOString()
  }

  static async insert(faq: DirectusFaqTemplate) {
    await CMSCacheFaqModel.query().insert({
      id: faq.id,
      content: JSON.stringify(faq),
    })

    return faq
  }

  static async update(faq: DirectusFaqTemplate) {
    await CMSCacheFaqModel.query()
      .where({ id: faq.id })
      .update({ content: JSON.stringify(faq) })

    return faq
  }

  static async upsert(faq: DirectusFaqTemplate) {
    const record = await this.getById(faq.id)
    if (record) {
      this.update(faq)
    } else {
      this.insert(faq)
    }

    return faq
  }

  static async getById(id: string) {
    return await CMSCacheFaqModel.query().findOne('id', id)
  }
}
