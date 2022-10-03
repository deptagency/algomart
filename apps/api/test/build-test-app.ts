import {
  AlgorandAdapter,
  CircleAdapter,
  NFTStorageAdapter,
  OnfidoAdapter,
} from '@algomart/shared/adapters'
import { configureTestResolver } from '@algomart/shared/services'
import {
  getTestDatabaseConfig,
  setupAlgorandAdapterMockImplementations,
  setupCircleAdapterMockImplementations,
  setupOnfidoAdapterMockImplementations,
} from '@algomart/shared/tests'
import buildApp from '@api/api/build-app'

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

  jest
    .spyOn(OnfidoAdapter.prototype, 'testConnection')
    .mockResolvedValue(Promise.resolve())

  // Setup the mocks here for all tests
  setupAlgorandAdapterMockImplementations()
  setupOnfidoAdapterMockImplementations()
  setupCircleAdapterMockImplementations()

  return await buildApp({
    container: configureTestResolver(),
    knex: getTestDatabaseConfig(database),
    fastify: {
      // uncomment to enable fastify logger
      // logger: true,
    },
  })
}
