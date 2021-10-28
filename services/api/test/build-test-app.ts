import { getTestDatabaseConfig } from './setup-tests'

import buildApp from '@/api/build-app'
import { configureResolver } from '@/shared/dependency-resolver'

export async function buildTestApp() {
  return await buildApp({
    container: configureResolver(),
    knex: getTestDatabaseConfig(),
    fastify: {
      // uncomment to enable fastify logger
      // logger: { prettyPrint: true },
    },
  })
}
