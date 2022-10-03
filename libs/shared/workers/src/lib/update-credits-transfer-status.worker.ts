import {
  CircleTransferStatus,
  EntityType,
  NotificationType,
} from '@algomart/schemas'
import {
  UpdateCreditsTransferData,
  UpdateCreditsTransferStatusQueueName,
} from '@algomart/shared/queues'
import {
  CollectiblesService,
  MarketplaceService,
  NotificationsService,
  PacksService,
  PaymentsService,
  PayoutService,
  UserAccountTransfersService,
} from '@algomart/shared/services'
import {
  DependencyResolver,
  formatBigIntToUSDFixed,
} from '@algomart/shared/utils'
import { Job, WorkerOptions } from 'bullmq'
import { Redis } from 'ioredis'

import { BaseWorker } from './shared-types'

export class UpdateCreditsTransferStatusWorker extends BaseWorker<UpdateCreditsTransferData> {
  constructor(
    connection: Redis,
    private readonly packsService: PacksService,
    private readonly paymentsService: PaymentsService,
    private readonly collectiblesService: CollectiblesService,
    private readonly marketplaceService: MarketplaceService,
    private readonly payoutService: PayoutService,
    private readonly notificationsService: NotificationsService,
    private readonly userAccountTransfersService: UserAccountTransfersService
  ) {
    super(UpdateCreditsTransferStatusQueueName, connection)
  }

  override getWorkerOptions(): WorkerOptions {
    const base = super.getWorkerOptions()
    return {
      ...base,
      concurrency: 20,
    }
  }

  async processor(
    job: Job<UpdateCreditsTransferData, void, string>
  ): Promise<void> {
    await job.log(`updating transfer status ${job.data.transfer.id}`)

    const userAccountTransfersService = this.userAccountTransfersService
    const packsService = this.packsService
    const paymentsService = this.paymentsService
    const marketplaceService = this.marketplaceService
    const collectiblesService = this.collectiblesService
    const notificationsService = this.notificationsService

    const transfer =
      await userAccountTransfersService.updateUserAccountTransferStatus(
        job.data
      )

    await job.log(`transfer status ${transfer.status}`)

    // if the transfer is already fully marked as complete then skip the next steps
    // to save resources
    if (transfer.creditsTransferJobCompletedAt !== null) {
      return void 0
    }

    switch (transfer.status) {
      case CircleTransferStatus.Pending: {
        await job.log(`Pending - No action required`)
        break
      }

      case CircleTransferStatus.Failed: {
        await job.log(`Failed, halting updates and running cleanup`)
        switch (transfer.entityType) {
          case EntityType.Payment: {
            // if a payment transfer fails then we want to create a new transfer and start the
            // process over. (The deposit is still considered pending)
            // This only applies to CC deposits. USDA deposits are not handled by this worker
            await userAccountTransfersService.retryFailedTransferAndMarkCurrentAsComplete(
              transfer
            )

            break
          }
          case EntityType.Pack: {
            // if a pack transfer fails then revert the pack owner
            await packsService.clearPackOwnerAndMarkCreditsTransferJobComplete({
              transferId: transfer.id,
              packId: transfer.entityId,
              userId: transfer.userAccountId,
            })

            break
          }
          case EntityType.CollectibleListings: {
            BigInt(transfer.amount) > 0
              ? // For seller we want to create a new transfer and start the
                // process over.
                await userAccountTransfersService.retryFailedTransferAndMarkCurrentAsComplete(
                  transfer
                )
              : // For buyer revert listing and mark credits transfer job complete
                // they have not been charged, they can try again
                await marketplaceService.revertListingAndMarkCreditsTransferJobComplete(
                  transfer.id,
                  transfer.entityId
                )
            break
          }
          case EntityType.WirePayout: {
            // We only need to mark the wire payout entity failed
            // since it was not actually submitted through circle
            await this.payoutService.markWirePayoutFailedWithoutBeingSubmitted(
              transfer.entityId
            )
            break
          }
          default: {
            await userAccountTransfersService.markTransferJobComplete(
              transfer.id
            )
          }
        }
        break
      }

      case CircleTransferStatus.Complete: {
        await job.log(`Success, done`)
        // Kick off the next step of the process (differs depending on the transfer.entityType)
        // Note: if there's a failure at any point here before marking the transfer as complete
        // at the end of this function, then we'd expect an eventual retry to call this function
        // again. This means that e.g. multiple tradeListing calls may be made for the same transfer,
        // multiple startPackTransfer calls may be made for the same transfer, etc.
        // each of these functions need to be idempotent/ retry-able
        switch (transfer.entityType) {
          case EntityType.Pack: {
            await packsService.startPackTransfer(transfer.entityId)

            break
          }

          case EntityType.CollectibleListings: {
            if (BigInt(transfer.amount) < 0) {
              // This was the buyer's transfer, start the trade if not already traded
              const listing = await marketplaceService.tradeListing(
                transfer.entityId
              )

              // If a listing was returned, trade and settlement succeeded
              // Send a notification to the purchaser
              if (listing) {
                const template =
                  await collectiblesService.getTemplateByListingId(
                    transfer.entityId,
                    'buyer'
                  )
                await notificationsService.createNotification({
                  userAccountId: transfer.userAccountId,
                  type: NotificationType.SecondaryPurchaseSuccess,
                  variables: {
                    collectibleTitle: template.title,
                  },
                })
              }

              // Submit the sellers transfer, now that the buyer has paid
              // If it fails, we'll retry this job
              await marketplaceService.submitTransferToSellerForSuccessfulMarketplacePurchase(
                transfer.entityId
              )
            }

            if (BigInt(transfer.amount) > 0) {
              // This was the seller's transfer, let's send a notification
              const template = await collectiblesService.getTemplateByListingId(
                transfer.entityId,
                'seller'
              )
              await notificationsService.createNotification({
                userAccountId: transfer.userAccountId,
                type: NotificationType.SecondarySaleSuccess,
                variables: {
                  collectibleTitle: template.title,
                  amount: formatBigIntToUSDFixed(BigInt(transfer.amount)),
                },
              })
            }

            break
          }

          case EntityType.Payment: {
            await paymentsService.handleUnifiedPaymentHandoff(transfer)

            break
          }

          case EntityType.WirePayout: {
            await this.payoutService.startSubmitWirePayout(transfer.entityId)
            break
          }
        }

        await userAccountTransfersService.markTransferJobComplete(transfer.id)

        break
      }
    }
  }

  static create(container: DependencyResolver) {
    return new UpdateCreditsTransferStatusWorker(
      container.get<Redis>('JOBS_REDIS'),
      container.get<PacksService>(PacksService.name),
      container.get<PaymentsService>(PaymentsService.name),
      container.get<CollectiblesService>(CollectiblesService.name),
      container.get<MarketplaceService>(MarketplaceService.name),
      container.get<PayoutService>(PayoutService.name),
      container.get<NotificationsService>(NotificationsService.name),
      container.get<UserAccountTransfersService>(
        UserAccountTransfersService.name
      )
    )
  }
}
