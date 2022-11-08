import {
  DirectusCollectibleTemplate,
  DirectusTemplateTag,
  EntityType,
} from '@algomart/schemas'
import { chunkArray } from '@algomart/shared/utils'
import { Model, raw } from 'objection'

import { CollectibleModel } from './collectible.model'
import { CMSCacheCollectionModel, CMSCacheSetModel } from '.'

export class CMSCacheCollectibleTemplateModel extends Model {
  static tableName = EntityType.CmsCacheCollectibleTemplates

  id!: string
  collectionId?: string
  content!: DirectusCollectibleTemplate
  setId?: string
  uniqueCode!: string
  tags!: object

  collection: CMSCacheCollectionModel
  set: CMSCacheSetModel

  createdAt!: string
  updatedAt!: string

  $beforeUpdate() {
    this.updatedAt = new Date().toISOString()
  }

  static relationMappings = () => ({
    collection: {
      relation: Model.BelongsToOneRelation,
      modelClass: CMSCacheCollectionModel,
      join: {
        from: 'CmsCacheCollectibleTemplates.collectionId',
        to: 'CmsCacheCollections.id',
      },
    },
    set: {
      relation: Model.BelongsToOneRelation,
      modelClass: CMSCacheSetModel,
      join: {
        from: 'CmsCacheCollectibleTemplates.setId',
        to: 'CmsCacheSets.id',
      },
    },
  })

  static async insert(collectibleTemplate: DirectusCollectibleTemplate) {
    await CMSCacheCollectibleTemplateModel.query().insert({
      id: collectibleTemplate.id,
      collectionId:
        collectibleTemplate.collection?.id ??
        collectibleTemplate.set?.collection?.id,
      content: collectibleTemplate,
      tags: this.getTagSlugs(collectibleTemplate.tags),
      setId: collectibleTemplate.set?.id,
      uniqueCode: collectibleTemplate.unique_code,
    })

    const collectibles = Array.from(
      { length: collectibleTemplate.total_editions },
      (_, index) => ({
        edition: index + 1,
        templateId: collectibleTemplate.id,
      })
    )

    const collectibleChunks = chunkArray(collectibles, 100)
    for (const collectibles of collectibleChunks) {
      await CollectibleModel.query().insert(collectibles)
    }

    return collectibleTemplate
  }

  static async update(collectibleTemplate: DirectusCollectibleTemplate) {
    await CMSCacheCollectibleTemplateModel.query()
      .where({ id: collectibleTemplate.id })
      .update({
        collectionId:
          collectibleTemplate.collection?.id ??
          collectibleTemplate.set?.collection?.id,
        content: collectibleTemplate,
        tags: this.getTagSlugs(collectibleTemplate.tags),
        setId: collectibleTemplate.set?.id,
        uniqueCode: collectibleTemplate.unique_code,
      })

    return collectibleTemplate
  }

  static async upsert(collectibleTemplate: DirectusCollectibleTemplate) {
    const record = await this.getById(collectibleTemplate.id)
    await (record
      ? this.update(collectibleTemplate)
      : this.insert(collectibleTemplate))

    return collectibleTemplate
  }

  static async removeTag(tagSlug) {
    await CMSCacheCollectibleTemplateModel.query()
      .where(raw('? = ANY(tags)', tagSlug))
      .patch({ tags: raw('(SELECT array_remove(tags, ?))', tagSlug) })
  }

  static async replaceTag(originalTagSlug, newTagSlug) {
    await CMSCacheCollectibleTemplateModel.query()
      .where(raw('? = ANY(tags)', originalTagSlug))
      .patch({
        tags: raw(
          '(SELECT array_replace(tags, ?, ?))',
          originalTagSlug,
          newTagSlug
        ),
      })
  }

  static async getById(id: string) {
    return await CMSCacheCollectibleTemplateModel.query().findOne('id', id)
  }

  private static getTagSlugs(tags: DirectusTemplateTag[]) {
    return tags.map(({ tags_id }) => tags_id.slug)
  }
}
