import buildApp from '@/api/build-app'
import { Configuration } from '@/configuration'
import {
  buildKnexMainConfiguration,
  buildKnexReadConfiguration,
} from '@/configuration/knex-config'
import { configureResolver } from '@/shared/dependency-resolver'
import { configureTasks } from '@/tasks'
import { logger } from '@/utils/logger'

buildApp({
  fastify: {
    logger: { prettyPrint: Configuration.env !== 'production' },
  },
  knexMain: buildKnexMainConfiguration(),
  knexRead: buildKnexReadConfiguration(),
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
