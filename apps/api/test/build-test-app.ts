import buildApp from '@api/api/build-app'
import AlgorandAdapter from '@api/lib/algorand-adapter'
import CircleAdapter from '@api/lib/circle-adapter'
import DirectusAdapter from '@api/lib/directus-adapter'
import NFTStorageAdapter from '@api/lib/nft-storage-adapter'
import { configureResolver } from '@api/shared/dependency-resolver'

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
