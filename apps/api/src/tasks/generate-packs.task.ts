import { logger } from '@api/configuration/logger'
import PacksService from '@api/modules/packs/packs.service'
import DependencyResolver from '@api/shared/dependency-resolver'
import { Model } from 'objection'

export default async function generatePacksTask(registry: DependencyResolver) {
  const log = logger.child({ task: 'generate-packs' })
  const packs = registry.get<PacksService>(PacksService.name)
  const trx = await Model.startTransaction()
  try {
    const result = await packs.generatePacks(trx)
    log.info('generated %d packs', result)
    await trx.commit()
  } catch (error) {
    await trx.rollback()
    log.error(error as Error, 'failed to generate packs')
  }
}
