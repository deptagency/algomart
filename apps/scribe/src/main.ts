import buildApp from './configuration/build-app'
import { Configuration } from './configuration/app-config'
import buildKnexConfiguration from './configuration/knex-config'
import { logger } from './configuration/logger'
import { configureResolver } from './configuration/configure-resolver'
import { configureTasks } from './tasks/configure-tasks'

buildApp({
  fastify: { logger },
  knex: buildKnexConfiguration(),
  container: configureResolver(),
  enableTrap: true,
})
  .then((app) => {
    configureTasks(app)
    return app.listen(Configuration.port, Configuration.host)
  })
  .then(() => {
    const addr = `${Configuration.host}:${Configuration.port}`
    logger.info(`SCRIBE service is listening at ${addr}`)
  })
  .catch((error) => {
    logger.error('Scribe service error', error)
    throw error
  })
