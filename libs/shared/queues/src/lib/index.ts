import { CheckMerchantBalanceQueue } from './check-merchant-balance.queue'
import { ClaimPackQueue } from './claim-pack.queue'
import { GeneratePacksQueue } from './generate-packs.queue'
import { ProcessExpiredPackAuctionBidsQueue } from './process-expired-pack-auction-bids.queue'
import { ProcessPackAuctionsQueue } from './process-pack-auctions.queue'
import { ReturnWirePayoutQueue } from './return-wire-payout.queue'
import { SendNotificationQueue } from './send-notification.queue'
import { BaseQueueConstructor } from './shared'
import { SubmitCreditsTransferQueue } from './submit-credits-transfer.queue'
import { SubmitKycMonitorQueue } from './submit-kyc-monitor.queue'
import { SubmitPaymentQueue } from './submit-payment.queue'
import { SubmitPaymentCardQueue } from './submit-payment-card.queue'
import { SubmitUsdcPaymentQueue } from './submit-usdc-payment.queue'
import { SubmitWireBankAccountQueue } from './submit-wire-bank-account.queue'
import { SubmitWirePayoutQueue } from './submit-wire-payout.queue'
import { SyncCMSCacheQueue } from './sync-cms-cache.queue'
import { UpdateCcPaymentStatusQueue } from './update-cc-payment-status.queue'
import { UpdateCreditsTransferStatusQueue } from './update-credits-transfer-status.queue'
import { UpdatePaymentCardStatusQueue } from './update-payment-card-status.queue'
import { UpdateSettledPaymentQueue } from './update-settled-payment.queue'
import { UpdateUsdcPaymentStatusQueue } from './update-usdc-payment-status.queue'
import { UpdateWireBankAccountStatusQueue } from './update-wire-bank-account-status.queue'
import { UpdateWirePayoutStatusQueue } from './update-wire-payout-status.queue'
import { UploadCollectibleFilesQueue } from './upload-collectible-files.queue'

export * from './check-merchant-balance.queue'
export * from './claim-pack.queue'
export * from './generate-packs.queue'
export * from './process-expired-pack-auction-bids.queue'
export * from './process-pack-auctions.queue'
export * from './return-wire-payout.queue'
export * from './send-notification.queue'
export * from './shared'
export * from './submit-credits-transfer.queue'
export * from './submit-kyc-monitor.queue'
export * from './submit-payment-card.queue'
export * from './submit-payment.queue'
export * from './submit-usdc-payment.queue'
export * from './submit-wire-bank-account.queue'
export * from './submit-wire-payout.queue'
export * from './sync-cms-cache.queue'
export * from './update-cc-payment-status.queue'
export * from './update-credits-transfer-status.queue'
export * from './update-payment-card-status.queue'
export * from './update-settled-payment.queue'
export * from './update-usdc-payment-status.queue'
export * from './update-wire-bank-account-status.queue'
export * from './update-wire-payout-status.queue'
export * from './upload-collectible-files.queue'

export const queues: BaseQueueConstructor[] = [
  CheckMerchantBalanceQueue,
  ClaimPackQueue,
  GeneratePacksQueue,
  ProcessExpiredPackAuctionBidsQueue,
  ProcessPackAuctionsQueue,
  SendNotificationQueue,
  SubmitCreditsTransferQueue,
  SubmitKycMonitorQueue,
  SubmitPaymentCardQueue,
  SubmitPaymentQueue,
  SubmitUsdcPaymentQueue,
  SubmitWireBankAccountQueue,
  SubmitWirePayoutQueue,
  SyncCMSCacheQueue,
  UpdateCreditsTransferStatusQueue,
  UpdatePaymentCardStatusQueue,
  UpdateCcPaymentStatusQueue,
  UpdateSettledPaymentQueue,
  UpdateUsdcPaymentStatusQueue,
  UpdateWireBankAccountStatusQueue,
  UpdateWirePayoutStatusQueue,
  UploadCollectibleFilesQueue,
  ReturnWirePayoutQueue,
]
