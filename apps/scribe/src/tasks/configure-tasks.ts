import { FastifyInstance } from 'fastify'
import { AsyncTask, SimpleIntervalJob, ToadScheduler } from 'toad-scheduler'

import {
  confirmTransactionsTask,
  dispatchNotificationsTask,
  generateCollectiblesTask,
  generatePacksTask,
  handlePackAuctionCompletionTask,
  handlePackAuctionExpirationTask,
  mintCollectiblesTask,
  storeCollectiblesTask,
  updateCurrencyConversionsTask,
  updatePaymentBankStatusesTask,
  updatePaymentCardStatusesTask,
  updatePaymentStatusesTask,
  syncCMSCacheTask,
  submitTransactionsTask,
} from '@algomart/scribe/tasks'

import { logger } from '../configuration/logger'
import { Configuration } from '../configuration/app-config'

type FastifyInstanceWithScheduler = FastifyInstance & {
  scheduler: ToadScheduler
}

export function configureTasks(app: FastifyInstanceWithScheduler) {
  //#region Sync CMS
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
            logger
          ),
        (error) => app.log.error(error)
      )
    )
  )
  //#endregion

  //#region Pack & Collectible generation/storage/minting
  app.scheduler.addSimpleIntervalJob(
    new SimpleIntervalJob(
      { seconds: 5 },
      new AsyncTask(
        'confirm-transactions',
        async () => await confirmTransactionsTask(app.container, logger),
        (error) => app.log.error(error)
      )
    )
  )

  app.scheduler.addSimpleIntervalJob(
    new SimpleIntervalJob(
      { seconds: 5 },
      new AsyncTask(
        'submit-transactions',
        async () => await submitTransactionsTask(app.container, logger),
        (error) => app.log.error(error)
      )
    )
  )

  app.scheduler.addSimpleIntervalJob(
    new SimpleIntervalJob(
      { minutes: 1, runImmediately: true },
      new AsyncTask(
        'generate-collectibles',
        async () => await generateCollectiblesTask(app.container, logger),
        (error) => app.log.error(error)
      )
    )
  )

  app.scheduler.addSimpleIntervalJob(
    new SimpleIntervalJob(
      { seconds: 30 },
      new AsyncTask(
        'store-collectibles',
        async () => await storeCollectiblesTask(app.container, logger),
        (error) => app.log.error(error)
      )
    )
  )

  app.scheduler.addSimpleIntervalJob(
    new SimpleIntervalJob(
      { minutes: 1 },
      new AsyncTask(
        'generate-packs',
        async () => await generatePacksTask(app.container, logger),
        (error) => app.log.error(error)
      )
    )
  )

  app.scheduler.addSimpleIntervalJob(
    new SimpleIntervalJob(
      { seconds: 10 },
      new AsyncTask(
        'mint-collectibles',
        async () => await mintCollectiblesTask(app.container, logger),
        (error) => app.log.error(error)
      )
    )
  )
  //#endregion

  //#region Notifications
  app.scheduler.addSimpleIntervalJob(
    new SimpleIntervalJob(
      { minutes: 1 },
      new AsyncTask(
        'dispatch-notifications',
        async () => await dispatchNotificationsTask(app.container, logger),
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
          await handlePackAuctionCompletionTask(app.container, logger),
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
          await handlePackAuctionExpirationTask(app.container, logger),
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
        async () => await updatePaymentBankStatusesTask(app.container, logger),
        (error) => app.log.error(error)
      )
    )
  )

  app.scheduler.addSimpleIntervalJob(
    new SimpleIntervalJob(
      { seconds: 10 },
      new AsyncTask(
        'check-pending-cards',
        async () => await updatePaymentCardStatusesTask(app.container, logger),
        (error) => app.log.error(error)
      )
    )
  )

  app.scheduler.addSimpleIntervalJob(
    new SimpleIntervalJob(
      { seconds: 10 },
      new AsyncTask(
        'check-pending-payments',
        async () => await updatePaymentStatusesTask(app.container, logger),
        (error) => app.log.error(error)
      )
    )
  )
  //#endregion
}
