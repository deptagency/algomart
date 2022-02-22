import buildApp from './app/build-app'
import { Configuration } from './configuration'
import { configureTasks } from './tasks'
import { configureResolver } from './configuration/configure-resolver'
import { logger } from './configuration/logger'

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
  .then(() => {
    const addr = `${Configuration.host}:${Configuration.port}`
    logger.info(`SCRIBE service is listening at ${addr}`)
  })
  .catch((error) => {
    logger.error(error, 'Scribe service error')
    throw error
  })
