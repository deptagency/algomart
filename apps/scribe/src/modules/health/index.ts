import { AlgorandAdapter, DirectusAdapter } from '@algomart/shared/adapters'
import { JobState } from 'bullmq'
import { FastifyInstance } from 'fastify'
import { Redis } from 'ioredis'

// #region helpers

/*
 * This code is fairly ugly, but just meant to be used by external periodic health checks.
 */

type JobStatuses = Record<
  string,
  {
    counts: Record<string, number>
    durations: { min: number; max: number; avg: number }
  }
>

async function getAllJobStatuses(app: FastifyInstance): Promise<JobStatuses> {
  return Object.fromEntries(
    await Promise.all(
      app.queues.map(async (queue) => {
        const allJobs = await queue.getJobs()
        const durations = allJobs
          .map((job) =>
            Math.max(
              Math.round((job.finishedOn ?? 0) - (job.processedOn ?? 0)),
              0
            )
          )
          .filter((duration) => duration > 0)
        const totalDuration = durations.reduce((a, b) => a + b, 0)

        return [
          queue.name,
          {
            counts: await queue.getJobCounts(),
            durations:
              durations.length === 0
                ? { min: 0, max: 0, avg: 0 }
                : {
                    min: Math.min(...durations),
                    max: Math.max(...durations),
                    avg: Math.round(totalDuration / durations.length),
                  },
          },
        ]
      })
    )
  )
}

function rollupJobStatuses(jobStatuses: JobStatuses) {
  const keys = Object.keys(jobStatuses)
  const counts: Record<JobState, number> = {
    active: 0,
    completed: 0,
    delayed: 0,
    failed: 0,
    waiting: 0,
    'waiting-children': 0,
  }

  const durations = {
    min: Number.POSITIVE_INFINITY,
    max: Number.NEGATIVE_INFINITY,
    avg: 0,
  }

  for (const key of keys) {
    const status = jobStatuses[key]

    for (const countKey of Object.keys(counts)) {
      counts[countKey] += status.counts[countKey]
    }

    if (status.durations.min === 0 || status.durations.max === 0) {
      // skip as this job has not yet run
      continue
    }

    durations.min = Math.min(status.durations.min, durations.min)
    durations.max = Math.max(status.durations.max, durations.max)
  }

  durations.avg = Math.round(
    (durations.max - durations.min) / 2 + durations.min
  )

  return {
    health: true,
    counts,
    durations,
    jobs: keys,
  }
}

async function getCMSStatus(app: FastifyInstance) {
  const cms = app.container.get<DirectusAdapter>(DirectusAdapter.name)
  // Attempt to fetch activities to ensure CMS is up and we can authenticate
  return await cms.sdk.activity
    .readByQuery({
      limit: 1,
    })
    .then(() => true)
    .catch(() => false)
}

async function getAlgodStatus(app: FastifyInstance) {
  const algorand = app.container.get<AlgorandAdapter>(AlgorandAdapter.name)
  // We use `getTransactionParams` over health checks since it requires an authenticated call
  return await algorand.algod
    .getTransactionParams()
    .do()
    .then(() => true)
    .catch(() => false)
}

async function getIndexerStatus(app: FastifyInstance) {
  const algorand = app.container.get<AlgorandAdapter>(AlgorandAdapter.name)
  // We use `searchForTransactions` over health checks since it requires an authenticated call
  return await algorand.indexer
    .searchForTransactions()
    .do()
    .then(() => true)
    .catch(() => false)
}

async function getDatabaseStatus(app: FastifyInstance) {
  const knex = app.knex
  // Bare minimum check to ensure we can query our database
  const stats = await knex.raw(`SELECT 1`).catch(() => ({ rows: [] }))
  return stats.rows.length === 1
}

async function getRedisStatus(app: FastifyInstance) {
  const redis = app.container.get<Redis>('JOBS_REDIS')

  return await redis
    .connect()
    .then(() => {
      // Since we lazily connect and keep multiple instances of Redis around,
      // we should explicitly disconnect this after we're done.
      redis.disconnect()
      return true
    })
    .catch(() => false)
}

// #endregion

const checks: [string, (app: FastifyInstance) => Promise<unknown>][] = [
  ['cms', getCMSStatus],
  ['postgres', getDatabaseStatus],
  ['algod', getAlgodStatus],
  ['indexer', getIndexerStatus],
  ['jobs_redis', getRedisStatus],
]

export async function setupHealth(app: FastifyInstance) {
  app.get('/', async (_, reply) => {
    const services = await Promise.all(
      checks.map(async ([name, check]) => ({
        name,
        healthy: await check(app),
      }))
    )

    const isOK = services.every((service) => service.healthy)

    reply.status(isOK ? 200 : 503)

    return {
      healthy: isOK,
      services,
    }
  })

  app.get('/jobs', async (_, reply) => {
    try {
      return rollupJobStatuses(await getAllJobStatuses(app))
    } catch (error) {
      app.log.error(error)
      reply.status(503)
      return { healthy: false }
    }
  })

  app.get('/postgres', async (_, reply) => {
    const healthy = await getDatabaseStatus(app)
    reply.status(healthy ? 200 : 503)
    return {
      healthy,
    }
  })

  app.get('/algod', async (_, reply) => {
    const healthy = await getAlgodStatus(app)
    reply.status(healthy ? 200 : 503)
    return {
      healthy,
    }
  })

  app.get('/indexer', async (_, reply) => {
    const healthy = await getIndexerStatus(app)
    reply.status(healthy ? 200 : 503)
    return {
      healthy,
    }
  })

  app.get('/jobs_redis', async (_, reply) => {
    const healthy = await getRedisStatus(app)
    reply.status(healthy ? 200 : 503)
    return {
      healthy,
    }
  })

  app.get('/cms', async (_, reply) => {
    const healthy = await getCMSStatus(app)
    reply.status(healthy ? 200 : 503)
    return {
      healthy,
    }
  })
}
