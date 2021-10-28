import { FastifyInstance } from 'fastify'
import { AsyncTask, SimpleIntervalJob } from 'toad-scheduler'

import confirmTransactionsTask from './confirm-transactions.task'
import dispatchNotificationsTask from './dispatch-notifications.task'
import generateCollectiblesTask from './generate-collectibles.task'
import generatePacksTask from './generate-packs.task'
import handlePackAuctionCompletionTask from './handle-pack-auction-completion.task'
import handlePackAuctionExpirationTask from './handle-pack-auction-expiration.task'
import mintCollectiblesTask from './mint-collectibles.task'
import { updatePaymentCardStatusesTask } from './update-payment-card-statuses.task'
import { updatePaymentStatusesTask } from './update-payment-statuses.task'

export function configureTasks(app: FastifyInstance) {
  //#region Pack & Collectible generation/minting
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
      { minutes: 1 },
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
        'generate-packs',
        async () => await generatePacksTask(app.container),
        (error) => app.log.error(error)
      )
    )
  )

  app.scheduler.addSimpleIntervalJob(
    new SimpleIntervalJob(
      { minutes: 1 },
      new AsyncTask(
        'generate-algorand-assets',
        async () => await mintCollectiblesTask(app.container),
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
}
