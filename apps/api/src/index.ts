import buildApp from '@/api/build-app'
import { Configuration } from '@/configuration'
import buildKnexConfiguration from '@/configuration/knex-config'
import { configureResolver } from '@/shared/dependency-resolver'
import { configureTasks } from '@/tasks'
import { logger, prettyOptions } from '@/utils/logger'

buildApp({
  fastify: {
    logger: {
      prettyPrint: Configuration.env === 'production' ? false : prettyOptions,
    },
  },
  knex: buildKnexConfiguration(),
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
