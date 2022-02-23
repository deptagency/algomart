import { DirectusAdapter } from '@algomart/shared/adapters'
import pino from 'pino'
import {
  CMSCacheCollectibleTemplateModel,
  CMSCacheCollectionModel,
  CMSCacheFaqModel,
  CMSCacheHomepageModel,
  CMSCacheLanguageModel,
  CMSCachePackTemplateModel,
  CMSCachePageModel,
  CMSCacheSetModel,
  CollectibleModel,
} from '@algomart/shared/models'
import { DependencyResolver } from '@algomart/shared/utils'

export async function syncCMSCacheTask(
  registry: DependencyResolver,
  logger: pino.Logger<unknown>
) {
  const cms = registry.get<DirectusAdapter>(DirectusAdapter.name)

  logger.info('starting syncLanguages')
  await syncLanguages(cms)
  logger.info('finished syncLanguages')
  logger.info('starting syncHomepage')
  await syncHomepage(cms)
  logger.info('finished syncHomepage')
  logger.info('starting syncFaqs')
  await syncFaqs(cms)
  logger.info('finished syncFaqs')
  // logger.info('starting syncPages')
  // await syncPages(cms)
  // logger.info('finished syncPages')
  logger.info('starting syncPackTemplates')
  await syncPackTemplates(cms)
  logger.info('finished syncPackTemplates')
  logger.info('starting syncCollectibleTemplates')
  await syncCollectibleTemplates(cms)
  logger.info('finished syncCollectibleTemplates')
  logger.info('starting syncCollections')
  await syncCollections(cms)
  logger.info('finished syncCollections')
  logger.info('starting syncSets')
  await syncSets(cms)
  logger.info('finished syncSets')
}

async function syncHomepage(cms: DirectusAdapter) {
  const homepage = await cms.findHomepage()

  if (homepage === null) {
    return
  }

  const currentRecord = await CMSCacheHomepageModel.query().findOne(
    'id',
    '=',
    homepage.id
  )

  await (currentRecord
    ? CMSCacheHomepageModel.query()
        .where({ id: homepage.id })
        .update({ content: JSON.stringify(homepage) })
    : CMSCacheHomepageModel.query().insert({
        id: homepage.id,
        content: JSON.stringify(homepage),
      }))
}

async function syncPages(cms: DirectusAdapter) {
  const results = await cms.findAllPages({ page: 1, pageSize: -1 })

  for (const page of results) {
    const currentRecord = await CMSCachePageModel.query().findOne('id', page.id)

    await (currentRecord
      ? CMSCachePageModel.query()
          .where({ id: page.id })
          .update({ content: JSON.stringify(page) })
      : CMSCachePageModel.query().insert({
          id: page.id,
          content: JSON.stringify(page),
        }))
  }
}

async function syncFaqs(cms: DirectusAdapter) {
  const results = await cms.getFaqs({ page: 1, pageSize: -1 })

  for (const faq of results) {
    const currentRecord = await CMSCacheFaqModel.query().findOne('id', faq.id)

    await (currentRecord
      ? CMSCacheFaqModel.query()
          .where({ id: faq.id })
          .update({ content: JSON.stringify(faq) })
      : CMSCacheFaqModel.query().insert({
          id: faq.id,
          content: JSON.stringify(faq),
        }))
  }
}

async function syncLanguages(cms: DirectusAdapter) {
  const results = await cms.getLanguages({ page: 1, pageSize: -1 })

  for (const language of results) {
    const currentRecord = await CMSCacheLanguageModel.query().findOne(
      'code',
      '=',
      language.code
    )

    await (currentRecord
      ? CMSCacheLanguageModel.query()
          .where({ code: language.code })
          .update({ content: JSON.stringify(language) })
      : CMSCacheLanguageModel.query()
          .insert({
            code: language.code,
            content: JSON.stringify(language),
          })
          .returning('code'))
  }
}

async function syncPackTemplates(cms: DirectusAdapter) {
  const results = await cms.findAllPacks({ pageSize: 200 })

  for (const packTemplate of results) {
    const currentRecord = await CMSCachePackTemplateModel.query().findOne(
      'id',
      packTemplate.id
    )

    await (currentRecord
      ? CMSCachePackTemplateModel.query()
          .where({ id: packTemplate.id })
          .update({
            type: packTemplate.type,
            releasedAt: packTemplate.released_at,
            auctionUntil: packTemplate.auction_until,
            content: JSON.stringify(packTemplate),
          })
      : CMSCachePackTemplateModel.query().insert({
          id: packTemplate.id,
          slug: packTemplate.slug,
          type: packTemplate.type,
          releasedAt: packTemplate.released_at,
          auctionUntil: packTemplate.auction_until,
          content: JSON.stringify(packTemplate),
        }))
  }
}

async function syncCollectibleTemplates(cms: DirectusAdapter) {
  const results = await cms.findAllCollectibles({ page: 1, pageSize: -1 })

  for (const collectibleTemplate of results) {
    const currentRecord =
      await CMSCacheCollectibleTemplateModel.query().findOne(
        'id',
        collectibleTemplate.id
      )

    if (currentRecord) {
      await CMSCacheCollectibleTemplateModel.query()
        .where({ id: collectibleTemplate.id })
        .update({ content: JSON.stringify(collectibleTemplate) })
    } else {
      await CMSCacheCollectibleTemplateModel.query().insert({
        id: collectibleTemplate.id,
        content: JSON.stringify(collectibleTemplate),
      })

      // Insert a new collectible
      await CollectibleModel.query().insert(
        Array.from(
          { length: collectibleTemplate.total_editions },
          (_, index) => ({
            edition: index + 1,
            templateId: collectibleTemplate.id,
          })
        )
      )
    }
  }
}

async function syncCollections(cms: DirectusAdapter) {
  const results = await cms.findAllCollections({ page: 1, pageSize: -1 })

  for (const collection of results) {
    const currentRecord = await CMSCacheCollectionModel.query().findOne(
      'id',
      collection.id
    )

    await (currentRecord
      ? CMSCacheCollectionModel.query()
          .where({ id: collection.id })
          .update({ content: JSON.stringify(collection) })
      : CMSCacheCollectionModel.query().insert({
          id: collection.id,
          slug: collection.slug,
          content: JSON.stringify(collection),
        }))
  }
}

async function syncSets(cms: DirectusAdapter) {
  const results = await cms.findAllSets({ page: 1, pageSize: -1 })

  for (const set of results) {
    const currentRecord = await CMSCacheSetModel.query().findOne('id', set.id)

    await (currentRecord
      ? CMSCacheSetModel.query()
          .where({ id: set.id })
          .update({ content: JSON.stringify(set) })
      : CMSCacheSetModel.query().insert({
          id: set.id,
          slug: set.slug,
          content: JSON.stringify(set),
        }))
  }
}
