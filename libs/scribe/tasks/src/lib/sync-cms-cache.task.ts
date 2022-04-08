import { DirectusAdapter } from '@algomart/shared/adapters'
import { DependencyResolver } from '@algomart/shared/utils'
import pino from 'pino'

export async function syncCMSCacheTask(
  registry: DependencyResolver,
  logger: pino.Logger<unknown>
) {
  const log = logger.child({ task: 'store-collectibles' })
  const cms = registry.get<DirectusAdapter>(DirectusAdapter.name)

  logger.info('starting syncLanguages')
  await cms.syncAllLanguages()
  logger.info('finished syncLanguages')
  log.info('starting syncApplication')
  await cms.syncApplication()
  log.info('finished syncApplication')
  log.info('starting syncHomepage')
  await cms.syncHomePage()
  log.info('finished syncHomepage')
  log.info('starting syncPackTemplates')
  await cms.syncAllPackTemplates()
  log.info('finished syncPackTemplates')
  log.info('starting syncCollectibleTemplates')
  await cms.syncAllCollectibleTemplates()
  log.info('finished syncCollectibleTemplates')
  log.info('starting syncCollections')
  await cms.syncAllCollections()
  log.info('finished syncCollections')
  log.info('starting syncSets')
  await cms.syncAllSets()
  log.info('finished syncSets')
}
