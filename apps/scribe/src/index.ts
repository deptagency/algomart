import buildApp from './app/build-app'
import { Configuration } from './configuration'
import {
  buildKnexMainConfiguration,
  buildKnexReadConfiguration,
} from './configuration/knex-config'
import { configureTasks } from './configuration/tasks'
import { configureResolver } from './configuration/configure-resolver'
import { logger } from './configuration/logger'

buildApp({
  fastify: {
    logger: { prettyPrint: Configuration.env !== 'production' },
  },
  knexMain: buildKnexMainConfiguration(),
  knexRead: buildKnexReadConfiguration(),
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
