import {
  AlgorandAdapter,
  CircleAdapter,
  NFTStorageAdapter,
} from '@algomart/shared/adapters'
import { configureTestResolver } from '@algomart/shared/services'
import { getTestDatabaseConfig } from '@algomart/shared/tests'

import buildApp from '../src/configuration/build-app'

export async function buildTestApp(database: string) {
  // jest
  //   .spyOn(CMSCacheAdapter.prototype, 'testConnection')
  //   .mockResolvedValue(Promise.resolve())

  jest
    .spyOn(AlgorandAdapter.prototype, 'testConnection')
    .mockResolvedValue(Promise.resolve())

  jest
    .spyOn(CircleAdapter.prototype, 'testConnection')
    .mockResolvedValue(Promise.resolve())

  jest
    .spyOn(NFTStorageAdapter.prototype, 'testConnection')
    .mockResolvedValue(Promise.resolve())

  return await buildApp({
    container: configureTestResolver(),
    knex: getTestDatabaseConfig(database),
    fastify: {
      // uncomment to enable fastify logger
      // logger: true,
    },
  })
}
