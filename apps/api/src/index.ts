import buildApp from './api/build-app'
import { configureResolver } from './configuration/configure-resolver'
import buildKnexConfiguration from './configuration/knex-config'
import { logger } from './configuration/logger'
import { Configuration } from './configuration'
import { configureTasks } from './tasks'

buildApp({
  fastify: {
    logger: { prettyPrint: Configuration.env !== 'production' },
  },
  knex: buildKnexConfiguration(),
  container: configureResolver(),
})
  .then((app) => {
    configureTasks(app)
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
