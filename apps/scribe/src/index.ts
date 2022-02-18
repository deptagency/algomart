import buildApp from './build-app'
import { Configuration } from './configuration'
import { configureTasks } from './tasks'
import { configureResolver } from './configuration/configure-resolver'
import { logger } from './utils/logger'

buildApp({
  fastify: {
    logger: { prettyPrint: Configuration.env !== 'production' },
  },
  container: configureResolver(),
})
  .then((app) => {
    configureTasks(app)
    return app.listen(Configuration.port, Configuration.host)
  })
  .catch((error) => {
    logger.error(error)
    throw error
  })
