import { DEFAULT_LANG, TagListQuery, TagQuery } from '@algomart/schemas'
import { CMSCacheTagModel } from '@algomart/shared/models'
import { Model } from 'objection'
import pino from 'pino'

export class TagsService {
  logger: pino.Logger<unknown>

  constructor(logger: pino.Logger<unknown>) {
    this.logger = logger.child({ context: this.constructor.name })
  }

  async searchTags(search: TagQuery, language = DEFAULT_LANG) {
    const knex = Model.knex()
    const results = await knex.raw(
      'select slug, title from search_tags(?, ?)',
      [search.query, language]
    )

    return results.rows
  }

  async listTagsBySlugs(query: TagListQuery) {
    const results = await CMSCacheTagModel.query()
      .where('language', query.language || DEFAULT_LANG)
      .whereIn('slug', query.slugs)

    return results.map((row) => {
      return { slug: row.slug, title: row.title }
    })
  }
}
