import { DirectusAdapter } from '@algomart/shared/adapters'
import { DependencyResolver } from '@algomart/shared/utils'
import pino from 'pino'

export async function syncCMSCacheTask(
  registry: DependencyResolver,
  logger: pino.Logger<unknown>
) {
  const cms = registry.get<DirectusAdapter>(DirectusAdapter.name)

  logger.info('starting syncLanguages')
  await cms.syncAllLanguages()
  logger.info('finished syncLanguages')
  logger.info('starting syncHomepage')
  await cms.syncHomePage()
  logger.info('finished syncHomepage')
  logger.info('starting syncFaqs')
  await cms.syncAllFaqs()
  logger.info('finished syncFaqs')
  // logger.info('starting syncPages')
  // await cms.syncAllPages()
  // logger.info('finished syncPages')
  logger.info('starting syncPackTemplates')
  await cms.syncAllPackTemplates()
  logger.info('finished syncPackTemplates')
  logger.info('starting syncCollectibleTemplates')
  await cms.syncAllCollectibleTemplates()
  logger.info('finished syncCollectibleTemplates')
  logger.info('starting syncCollections')
  await cms.syncAllCollections()
  logger.info('finished syncCollections')
  logger.info('starting syncSets')
  await cms.syncAllSets()
  logger.info('finished syncSets')
}
