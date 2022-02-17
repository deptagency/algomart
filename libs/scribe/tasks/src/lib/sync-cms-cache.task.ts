import { Model } from 'objection'

import DirectusAdapter from '@/lib/directus-adapter'
import { CMSCacheFaqModel } from '@/models/cms-cache-faq.model'
import { CMSCacheHomepageModel } from '@/models/cms-cache-homepage.model'
import { CMSCacheLanguageModel } from '@/models/cms-cache-language.model'
import DependencyResolver from '@/shared/dependency-resolver'
import { logger } from '@/utils/logger'

export default async function syncCMSCacheTask(registry: DependencyResolver) {
  const log = logger.child({ task: 'confirm-transactions' })
  const cms = registry.get<DirectusAdapter>(DirectusAdapter.name)

  syncHomepage(cms)
  // syncPages(cms)
  // syncFaqs(cms)
  syncLanguages(cms)
  // syncPackTemplates(cms)
  // syncCollectibleTemplates(cms)
  // syncSets(cms)

  // try {
  //   const result = await transactions.confirmPendingTransactions(undefined, trx)
  //   await trx.commit()
  //   log.info(result, 'updated transactions')
  // } catch (error) {
  //   await trx.rollback()
  //   log.error(error as Error, 'failed to update transactions')
  // }
}

function syncHomepage(cms: DirectusAdapter) {
  const homepage = cms.findHomepage()
  if (homepage === null) {
    return
  }

  const currentRecord = await CMSCacheHomepageModel.query().findOne(
    'id',
    homepage.id
  )

  if (currentRecord === null) {
    CMSCacheHomepageModel.query().insert({
      id: homepage.id,
      content: homepage,
    })
  } else {
    CMSCacheHomepageModel.query()
      .where({ id: homepage.id })
      .update({ content: homepage.content })
  }
}

// function syncPages(cms: DirectusAdapter) {
// }

function syncFaqs(cms: DirectusAdapter) {
  const results = cms.getFaqs()

  results.data.each((faq) => {
    const currentRecord = CMSCacheFaqModel.query().findOne('id', faq.id)

    if (currentRecord === null) {
      CMSCacheFaqModel.query().insert({
        id: faq.id,
        content: faq,
      })
    } else {
      CMSCacheFaqModel.query().where({ id: faq.id }).update({ content: faq })
    }
  })
}

function syncLanguages(cms: DirectusAdapter) {
  const results = cms.getLanguages()

  results.data.each((language) => {
    const currentRecord = CMSCacheLanguageModel.query().findOne(
      'id',
      language.id
    )

    if (currentRecord === null) {
      CMSCacheLanguageModel.query().insert({
        id: language.id,
        content: language,
      })
    } else {
      CMSCacheLanguageModel.query()
        .where({ id: language.id })
        .update({ content: language })
    }
  })
}

// function syncPackTemplates(cms: DirectusAdapter) {

// }

// function syncCollectibleTemplates(cms: DirectusAdapter) {

// }

// function syncSets(cms: DirectusAdapter) {

// }
