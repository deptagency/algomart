import {
  DirectusTag,
  DirectusTagTranslation,
  EntityType,
} from '@algomart/schemas'
import { Model } from 'objection'

export class CMSCacheTagModel extends Model {
  static tableName = EntityType.CmsCacheTags

  id!: string
  slug!: string
  language!: string
  title!: string
  searchTitle!: string
  createdAt!: string
  updatedAt!: string

  $beforeUpdate() {
    this.updatedAt = new Date().toISOString()
  }

  static relationMappings = () => ({})

  static async insert(tag: DirectusTag, translation: DirectusTagTranslation) {
    await CMSCacheTagModel.query().insert({
      id: tag.id,
      slug: tag.slug,
      language: translation.languages_code,
      title: translation.title,
    })

    return tag
  }

  static async update(tag: DirectusTag, translation: DirectusTagTranslation) {
    await CMSCacheTagModel.query()
      .where({ id: tag.id, language: translation.languages_code })
      .update({
        slug: tag.slug,
        title: translation.title,
      })

    return tag
  }

  static async upsert(tag: DirectusTag) {
    for (const translation of tag.translations) {
      const record = await this.getById(tag.id, translation.languages_code)
      await (record
        ? this.update(tag, translation)
        : this.insert(tag, translation))
    }

    return tag
  }

  static async getById(id: string, language: string) {
    return await CMSCacheTagModel.query().findOne({ id, language })
  }
}
