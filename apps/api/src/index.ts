import buildApp from './api/build-app'
import { configureResolver } from './configuration/configure-resolver'
import {
  buildKnexMainConfiguration,
  buildKnexReadConfiguration,
} from './configuration/knex-config'
import { logger } from './configuration/logger'
import { Configuration } from './configuration'
import { configureTasks } from './tasks'

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
    logger.info(`API service is listening at ${addr}`)
  })
  .catch((error) => {
    logger.error(error)
    throw error
  })
