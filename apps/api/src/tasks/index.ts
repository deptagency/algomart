import { FastifyInstance } from 'fastify'
import { AsyncTask, SimpleIntervalJob } from 'toad-scheduler'

import confirmTransactionsTask from './confirm-transactions.task'
import dispatchNotificationsTask from './dispatch-notifications.task'
import generateCollectiblesTask from './generate-collectibles.task'
import generatePacksTask from './generate-packs.task'
import handlePackAuctionCompletionTask from './handle-pack-auction-completion.task'
import handlePackAuctionExpirationTask from './handle-pack-auction-expiration.task'
import mintCollectiblesTask from './mint-collectibles.task'
import storeCollectiblesTask from './store-collectibles.task'
import updateCurrencyConversions from './update-currency-conversions.task'
import { updatePaymentBankStatusesTask } from './update-payment-bank-statuses.task'
import { updatePaymentCardStatusesTask } from './update-payment-card-statuses.task'
import { updatePaymentStatusesTask } from './update-payment-statuses.task'

export function configureTasks(app: FastifyInstance) {
  //#region Pack & Collectible generation/storage/minting
  app.scheduler.addSimpleIntervalJob(
    new SimpleIntervalJob(
      { seconds: 10 },
      new AsyncTask(
        'confirm-transactions',
        async () => await confirmTransactionsTask(app.container),
        (error) => app.log.error(error)
      )
    )
  )

  app.scheduler.addSimpleIntervalJob(
    new SimpleIntervalJob(
      { minutes: 1, runImmediately: true },
      new AsyncTask(
        'generate-collectibles',
        async () => await generateCollectiblesTask(app.container),
        (error) => app.log.error(error)
      )
    )
  )

  app.scheduler.addSimpleIntervalJob(
    new SimpleIntervalJob(
      { minutes: 1 },
      new AsyncTask(
        'store-collectibles',
        async () => await storeCollectiblesTask(app.container),
        (error) => app.log.error(error)
      )
    )
  )

  app.scheduler.addSimpleIntervalJob(
    new SimpleIntervalJob(
      { minutes: 1 },
      new AsyncTask(
        'generate-packs',
        async () => await generatePacksTask(app.container),
        (error) => app.log.error(error)
      )
    )
  )

  app.scheduler.addSimpleIntervalJob(
    new SimpleIntervalJob(
      { seconds: 10 },
      new AsyncTask(
        'mint-collectibles',
        async () => await mintCollectiblesTask(app.container, app.knexMain),
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
        async () => await dispatchNotificationsTask(app.container),
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
        async () => await handlePackAuctionCompletionTask(app.container),
        (error) => app.log.error(error)
      )
    )
  )

  app.scheduler.addSimpleIntervalJob(
    new SimpleIntervalJob(
      { minutes: 1 },
      new AsyncTask(
        'handle-pack-auction-expiration',
        async () => await handlePackAuctionExpirationTask(app.container),
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
        async () => await updatePaymentBankStatusesTask(app.container),
        (error) => app.log.error(error)
      )
    )
  )

  app.scheduler.addSimpleIntervalJob(
    new SimpleIntervalJob(
      { seconds: 10 },
      new AsyncTask(
        'check-pending-cards',
        async () => await updatePaymentCardStatusesTask(app.container),
        (error) => app.log.error(error)
      )
    )
  )

  app.scheduler.addSimpleIntervalJob(
    new SimpleIntervalJob(
      { seconds: 10 },
      new AsyncTask(
        'check-pending-payments',
        async () => await updatePaymentStatusesTask(app.container),
        (error) => app.log.error(error)
      )
    )
  )
  //#endregion

  //#region Currency Rates
  app.scheduler.addSimpleIntervalJob(
    new SimpleIntervalJob(
      { hours: 1 },
      new AsyncTask(
        'update-currency-conversions',
        async () => await updateCurrencyConversions(app.container),
        (error) => app.log.error(error)
      )
    )
  )
  //#endregion
}
