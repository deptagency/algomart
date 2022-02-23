import { FastifyInstance } from 'fastify'
import pino from 'pino'
import { AsyncTask, SimpleIntervalJob } from 'toad-scheduler'

import { Configuration } from '../configuration'

import {
  confirmTransactionsTask,
  dispatchNotificationsTask,
  generatePacksTask,
  handlePackAuctionCompletionTask,
  handlePackAuctionExpirationTask,
  mintCollectiblesTask,
  storeCollectiblesTask,
  syncCMSCacheTask,
  updateCurrencyConversionsTask,
  updatePaymentBankStatusesTask,
  updatePaymentCardStatusesTask,
  updatePaymentStatusesTask,
} from '@algomart/scribe/tasks'

export function configureTasks(
  app: FastifyInstance,
  logger: pino.Logger<unknown>
) {
  //#region Pack & Collectible generation/storage/minting
  app.scheduler.addSimpleIntervalJob(
    new SimpleIntervalJob(
      { seconds: 10 },
      new AsyncTask(
        'confirm-transactions',
        async () =>
          await confirmTransactionsTask(app.container, logger, app.knexRead),
        (error) => app.log.error(error)
      )
    )
  )

  app.scheduler.addSimpleIntervalJob(
    new SimpleIntervalJob(
      { minutes: 1 },
      new AsyncTask(
        'store-collectibles',
        async () =>
          await storeCollectiblesTask(app.container, logger, app.knexRead),
        (error) => app.log.error(error)
      )
    )
  )

  app.scheduler.addSimpleIntervalJob(
    new SimpleIntervalJob(
      { minutes: 1 },
      new AsyncTask(
        'generate-packs',
        async () =>
          await generatePacksTask(app.container, logger, app.knexRead),
        (error) => app.log.error(error)
      )
    )
  )

  app.scheduler.addSimpleIntervalJob(
    new SimpleIntervalJob(
      { seconds: 10 },
      new AsyncTask(
        'mint-collectibles',
        async () =>
          await mintCollectiblesTask(app.container, logger, app.knexRead),
        (error) => app.log.error(error)
      )
    )
  )
  //#endregion

  // //#region Notifications
  app.scheduler.addSimpleIntervalJob(
    new SimpleIntervalJob(
      { minutes: 1 },
      new AsyncTask(
        'dispatch-notifications',
        async () =>
          await dispatchNotificationsTask(app.container, logger, app.knexRead),
        (error) => app.log.error(error)
      )
    )
  )
  //#endregion

  //#region Bids & Auctions
  app.scheduler.addSimpleIntervalJob(
    new SimpleIntervalJob(
      { minutes: 1 },
      new AsyncTask(
        'handle-pack-auction-completion',
        async () =>
          await handlePackAuctionCompletionTask(
            app.container,
            logger,
            app.knexRead
          ),
        (error) => app.log.error(error)
      )
    )
  )

  app.scheduler.addSimpleIntervalJob(
    new SimpleIntervalJob(
      { minutes: 1 },
      new AsyncTask(
        'handle-pack-auction-expiration',
        async () =>
          await handlePackAuctionExpirationTask(
            app.container,
            logger,
            app.knexRead
          ),
        (error) => app.log.error(error)
      )
    )
  )
  //#endregion

  //#region Circle Payments
  app.scheduler.addSimpleIntervalJob(
    new SimpleIntervalJob(
      { minutes: 1 },
      new AsyncTask(
        'check-pending-banks',
        async () =>
          await updatePaymentBankStatusesTask(
            app.container,
            logger,
            app.knexRead
          ),
        (error) => app.log.error(error)
      )
    )
  )

  app.scheduler.addSimpleIntervalJob(
    new SimpleIntervalJob(
      { seconds: 10 },
      new AsyncTask(
        'check-pending-cards',
        async () =>
          await updatePaymentCardStatusesTask(
            app.container,
            logger,
            app.knexRead
          ),
        (error) => app.log.error(error)
      )
    )
  )

  app.scheduler.addSimpleIntervalJob(
    new SimpleIntervalJob(
      { seconds: 10 },
      new AsyncTask(
        'check-pending-payments',
        async () =>
          await updatePaymentStatusesTask(app.container, logger, app.knexRead),
        (error) => app.log.error(error)
      )
    )
  )

  app.scheduler.addIntervalJob(
    new SimpleIntervalJob(
      { minutes: 60, runImmediately: true },
      new AsyncTask(
        'sync-cms-cache',
        async () => await syncCMSCacheTask(app.container, logger),
        (error) => app.log.error(error)
      )
    )
  )
  //#endregion

  // #region Currency Rates
  app.scheduler.addSimpleIntervalJob(
    new SimpleIntervalJob(
      { hours: 1 },
      new AsyncTask(
        'update-currency-conversions',
        async () =>
          await updateCurrencyConversionsTask(
            app.container,
            Configuration.currency,
            logger,
            app.knexRead
          ),
        (error) => app.log.error(error)
      )
    )
  )
  //#endregion
}
