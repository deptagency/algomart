import buildApp from './app/build-app'
import { Configuration } from './configuration'
import { configureTasks } from './configuration/tasks'
import { configureResolver } from './configuration/configure-resolver'
import { logger } from './configuration/logger'

import { Knex } from 'knex'
import path from 'node:path'

export function buildKnexConfiguration(): Knex.Config {
  return {
    client: 'pg',
    connection: Configuration.databaseUrl,
    searchPath: [Configuration.databaseSchema],
    pool: { min: 2, max: 20 },
    // migrations: {
    //   extension: 'ts',
    //   directory: path.join(__dirname, '..', 'migrations'),
    // },
  }
}

buildApp({
  fastify: {
    logger: { prettyPrint: Configuration.env !== 'production' },
  },
  knex: buildKnexConfiguration(),
  container: configureResolver(),
})
  .then((app) => {
    configureTasks(app, logger)
    return app.listen(Configuration.port, Configuration.host)
  })
  .then(() => {
    const addr = `${Configuration.host}:${Configuration.port}`
    logger.info(`SCRIBE service is listening at ${addr}`)
  })
  .catch((error) => {
    logger.error(error, 'Scribe service error')
    throw error
  })
