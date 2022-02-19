import DirectusAdapter from '@/lib/directus-adapter'
import { CMSCacheCollectibleTemplateModel } from '@/models/cms-cache-collectible-template.model'
import { CMSCacheCollectionModel } from '@/models/cms-cache-collection.model'
import { CMSCacheFaqModel } from '@/models/cms-cache-faq.model'
import { CMSCacheHomepageModel } from '@/models/cms-cache-homepage.model'
import { CMSCacheLanguageModel } from '@/models/cms-cache-language.model'
import { CMSCachePackTemplateModel } from '@/models/cms-cache-pack-template.model'
import { CMSCachePageModel } from '@/models/cms-cache-page.model'
import { CMSCacheSetModel } from '@/models/cms-cache-set.model'
import { CollectibleModel } from '@/models/collectible.model'
import DependencyResolver from '@/shared/dependency-resolver'
import { logger } from '@/utils/logger'

export default async function syncCMSCacheTask(registry: DependencyResolver) {
  const log = logger.child({ task: 'confirm-transactions' })
  const cms = registry.get<DirectusAdapter>(DirectusAdapter.name)

  console.log('starting syncLanguages')
  await syncLanguages(cms)
  console.log('finished syncLanguages')
  console.log('starting syncHomepage')
  await syncHomepage(cms)
  console.log('finished syncHomepage')
  console.log('starting syncFaqs')
  await syncFaqs(cms)
  console.log('finished syncFaqs')
  // console.log('starting syncPages')
  // await syncPages(cms)
  // console.log('finished syncPages')
  console.log('starting syncPackTemplates')
  await syncPackTemplates(cms)
  console.log('finished syncPackTemplates')
  console.log('starting syncCollectibleTemplates')
  await syncCollectibleTemplates(cms)
  console.log('finished syncCollectibleTemplates')
  console.log('starting syncCollections')
  await syncCollections(cms)
  console.log('finished syncCollections')
  console.log('starting syncSets')
  await syncSets(cms)
  console.log('finished syncSets')
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
  const results = await cms.findAllPages()

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
  const results = await cms.getFaqs()

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
  const results = await cms.getLanguages()

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
            content: JSON.stringify(packTemplate),
          })
      : CMSCachePackTemplateModel.query().insert({
          id: packTemplate.id,
          slug: packTemplate.slug,
          type: packTemplate.type,
          releasedAt: packTemplate.released_at,
          content: JSON.stringify(packTemplate),
        }))
  }
}

async function syncCollectibleTemplates(cms: DirectusAdapter) {
  const results = await cms.findAllCollectibles()

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
  const results = await cms.findAllCollections()

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
  const results = await cms.findAllSets()

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
