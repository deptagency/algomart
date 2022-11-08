import {
  CheckMerchantBalanceQueue,
  ProcessExpiredPackAuctionBidsQueue,
  ProcessPackAuctionsQueue,
  SubmitKycMonitorQueue,
  SyncCMSCacheQueue,
} from '@algomart/shared/queues'
import { FastifyInstance } from 'fastify'

export function configureTasks(app: FastifyInstance) {
  app.container
    .get<CheckMerchantBalanceQueue>(CheckMerchantBalanceQueue.name)
    .enqueue()

  app.container.get<SyncCMSCacheQueue>(SyncCMSCacheQueue.name).enqueue()

  app.container
    .get<ProcessPackAuctionsQueue>(ProcessPackAuctionsQueue.name)
    .enqueue()

  app.container
    .get<ProcessExpiredPackAuctionBidsQueue>(
      ProcessExpiredPackAuctionBidsQueue.name
    )
    .enqueue()

  app.container.get<SubmitKycMonitorQueue>(SubmitKycMonitorQueue.name).enqueue()
}
