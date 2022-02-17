import DirectusAdapter from '@/lib/directus-adapter'
import { CMSCacheCollectibleTemplateModel } from '@/models/cms-cache-collectible-template.model'
import { CMSCacheCollectionModel } from '@/models/cms-cache-collection.model'
import { CMSCacheFaqModel } from '@/models/cms-cache-faq.model'
import { CMSCacheHomepageModel } from '@/models/cms-cache-homepage.model'
import { CMSCacheLanguageModel } from '@/models/cms-cache-language.model'
import { CMSCachePackTemplateModel } from '@/models/cms-cache-pack-template.model'
import { CMSCacheSetModel } from '@/models/cms-cache-set.model'
import DependencyResolver from '@/shared/dependency-resolver'
import { logger } from '@/utils/logger'

export default async function syncCMSCacheTask(registry: DependencyResolver) {
  const log = logger.child({ task: 'confirm-transactions' })
  const cms = registry.get<DirectusAdapter>(DirectusAdapter.name)

  await syncLanguages(cms)
  await syncHomepage(cms)
  await syncFaqs(cms)
  // await syncPages(cms)
  await syncPackTemplates(cms)
  await syncCollectibleTemplates(cms)
  await syncCollections(cms)
  await syncSets(cms)
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

  await (currentRecord ? CMSCacheHomepageModel.query()
      .where({ id: homepage.id })
      .update({ content: JSON.stringify(homepage) }) : CMSCacheHomepageModel.query().insert({
      id: homepage.id,
      content: JSON.stringify(homepage),
    }));
}

// function syncPages(cms: DirectusAdapter) {
// }

async function syncFaqs(cms: DirectusAdapter) {
  const results = await cms.getFaqs()

  for (const faq of results) {
    const currentRecord = await CMSCacheFaqModel.query().findOne('id', faq.id)

    await (currentRecord ? CMSCacheFaqModel.query()
        .where({ id: faq.id })
        .update({ content: JSON.stringify(faq) }) : CMSCacheFaqModel.query().insert({
        id: faq.id,
        content: JSON.stringify(faq),
      }));
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

    await (currentRecord ? CMSCacheLanguageModel.query()
        .where({ code: language.code })
        .update({ content: JSON.stringify(language) }) : CMSCacheLanguageModel.query()
        .insert({
          code: language.code,
          content: JSON.stringify(language),
        })
        .returning('code'));
  }
}

async function syncPackTemplates(cms: DirectusAdapter) {
  const results = await cms.findAllPacks({ pageSize: 200 })

  for (const packTemplate of results) {
    const currentRecord = await CMSCachePackTemplateModel.query().findOne(
      'id',
      packTemplate.id
    )

    await (currentRecord ? CMSCachePackTemplateModel.query()
        .where({ id: packTemplate.id })
        .update({
          type: packTemplate.type,
          releasedAt: packTemplate.released_at,
          content: JSON.stringify(packTemplate),
        }) : CMSCachePackTemplateModel.query().insert({
        id: packTemplate.id,
        slug: packTemplate.slug,
        type: packTemplate.type,
        releasedAt: packTemplate.released_at,
        content: JSON.stringify(packTemplate),
      }));
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

    await (currentRecord ? CMSCacheCollectibleTemplateModel.query()
        .where({ id: collectibleTemplate.id })
        .update({ content: JSON.stringify(collectibleTemplate) }) : CMSCacheCollectibleTemplateModel.query().insert({
        id: collectibleTemplate.id,
        content: JSON.stringify(collectibleTemplate),
      }));
  }
}

async function syncCollections(cms: DirectusAdapter) {
  const results = await cms.findAllCollections()

  for (const collection of results) {
    const currentRecord = await CMSCacheCollectionModel.query().findOne(
      'id',
      collection.id
    )

    await (currentRecord ? CMSCacheCollectionModel.query()
        .where({ id: collection.id })
        .update({ content: JSON.stringify(collection) }) : CMSCacheCollectionModel.query().insert({
        id: collection.id,
        slug: collection.slug,
        content: JSON.stringify(collection),
      }));
  }
}

async function syncSets(cms: DirectusAdapter) {
  const results = await cms.findAllSets()

  for (const set of results) {
    const currentRecord = await CMSCacheSetModel.query().findOne('id', set.id)

    await (currentRecord ? CMSCacheSetModel.query()
        .where({ id: set.id })
        .update({ content: JSON.stringify(set) }) : CMSCacheSetModel.query().insert({
        id: set.id,
        slug: set.slug,
        content: JSON.stringify(set),
      }));
  }
}
