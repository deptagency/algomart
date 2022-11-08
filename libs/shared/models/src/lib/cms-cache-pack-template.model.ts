import {
  DirectusPackTemplate,
  DirectusTemplateTag,
  EntityType,
} from '@algomart/schemas'
import { Model, raw } from 'objection'

import { PackModel } from './pack.model'

export class CMSCachePackTemplateModel extends Model {
  static tableName = EntityType.CmsCachePackTemplates

  id!: string
  slug!: string
  type!: string
  price!: number
  tags!: object
  content!: DirectusPackTemplate
  releasedAt!: string | null
  auctionUntil!: string | null

  createdAt!: string
  updatedAt!: string

  $beforeUpdate() {
    this.updatedAt = new Date().toISOString()
  }

  static relationMappings = () => ({
    pack: {
      relation: Model.BelongsToOneRelation,
      modelClass: PackModel,
      join: {
        from: 'CmsCachePackTemplates.id',
        to: 'Pack.templateId',
      },
    },
  })

  static async insert(packTemplate: DirectusPackTemplate) {
    await CMSCachePackTemplateModel.query().insert({
      id: packTemplate.id,
      slug: packTemplate.slug,
      type: packTemplate.type,
      price: packTemplate.price ?? undefined,
      releasedAt: packTemplate.released_at,
      auctionUntil: packTemplate.auction_until,
      tags: this.getTagSlugs(packTemplate.tags),
      content: packTemplate,
    })

    return packTemplate
  }

  static async update(packTemplate: DirectusPackTemplate) {
    await CMSCachePackTemplateModel.query()
      .where({ id: packTemplate.id })
      .update({
        auctionUntil: packTemplate.auction_until,
        content: packTemplate,
        price: packTemplate.price,
        releasedAt: packTemplate.released_at,
        tags: this.getTagSlugs(packTemplate.tags),
      })

    return packTemplate
  }

  static async upsert(packTemplate: DirectusPackTemplate) {
    const record = await this.getById(packTemplate.id)
    await (record ? this.update(packTemplate) : this.insert(packTemplate))

    return packTemplate
  }

  static async getById(id: string) {
    return await CMSCachePackTemplateModel.query().findOne('id', id)
  }

  static async removeTag(tagSlug) {
    await CMSCachePackTemplateModel.query()
      .where(raw('? = ANY(tags)', tagSlug))
      .patch({ tags: raw('(SELECT array_remove(tags, ?))', tagSlug) })
  }

  static async replaceTag(originalTagSlug, newTagSlug) {
    await CMSCachePackTemplateModel.query()
      .where(raw('? = ANY(tags)', originalTagSlug))
      .patch({
        tags: raw(
          '(SELECT array_replace(tags, ?, ?))',
          originalTagSlug,
          newTagSlug
        ),
      })
  }

  private static getTagSlugs(tags: DirectusTemplateTag[]) {
    return tags.map(({ tags_id }) => tags_id.slug)
  }
}
