import {
  AlgorandAdapter,
  CircleAdapter,
  DirectusAdapter,
  NFTStorageAdapter,
} from '@algomart/shared/adapters'
import buildApp from '@api/api/build-app'
import { configureResolver } from '@api/configuration/configure-resolver'

import { getTestDatabaseConfig } from './setup-tests'

export async function buildTestApp(database: string) {
  jest
    .spyOn(DirectusAdapter.prototype, 'testConnection')
    .mockResolvedValue(Promise.resolve())

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
    container: configureResolver(),
    knex: getTestDatabaseConfig(database),
    fastify: {
      // uncomment to enable fastify logger
      // logger: { prettyPrint: true },
    },
  })
}
