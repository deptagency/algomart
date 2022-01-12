import { Model } from 'objection'

import PacksService from '@/modules/packs/packs.service'
import DependencyResolver from '@/shared/dependency-resolver'
import { logger } from '@/utils/logger'

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
