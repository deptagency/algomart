import buildApp from './configuration/build-app'
import { configureResolver } from './configuration/configure-resolver'
import buildKnexConfiguration from './configuration/knex-config'
import { logger } from './configuration/logger'
import { configureTasks } from './configuration/tasks'
import { Configuration } from './configuration'

buildApp({
  fastify: { logger },
  knex: buildKnexConfiguration(),
  container: configureResolver(),
  enableTrap: true,
})
  .then((app) => {
    configureTasks(app)
    return app.listen({
      port: Configuration.port,
      host: Configuration.host,
    })
  })
  .then(() => {
    const addr = `${Configuration.host}:${Configuration.port}`
    logger.info(`SCRIBE service is listening at ${addr}`)
  })
  .catch((error) => {
    logger.error('SCRIBE service error', error)
    throw error
  })
