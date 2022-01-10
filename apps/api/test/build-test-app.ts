import { getTestDatabaseConfig } from './setup-tests'

import buildApp from '@/api/build-app'
import AlgorandAdapter from '@/lib/algorand-adapter'
import CircleAdapter from '@/lib/circle-adapter'
import DirectusAdapter from '@/lib/directus-adapter'
import NFTStorageAdapter from '@/lib/nft-storage-adapter'
import { configureResolver } from '@/shared/dependency-resolver'

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
