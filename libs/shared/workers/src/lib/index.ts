import { CheckMerchantBalanceWorker } from './check-merchant-balance.worker'
import { ClaimPackWorker } from './claim-pack.worker'
import { GeneratePacksWorker } from './generate-packs.worker'
import { ProcessExpiredPackAuctionBidsWorker } from './process-expired-pack-auction-bids.worker'
import { ProcessPackAuctionsWorker } from './process-pack-auctions.worker'
import { ReturnWirePayoutWorker } from './return-wire-payout.worker'
import { SendNotificationWorker } from './send-notification.worker'
import { BaseWorkerConstructor } from './shared-types'
import { SubmitCreditsTransferWorker } from './submit-credits-transfer.worker'
import { SubmitKycMonitorWorker } from './submit-kyc-monitor.worker'
import { SubmitPaymentWorker } from './submit-payment.worker'
import { SubmitPaymentCardWorker } from './submit-payment-card.worker'
import { SubmitUsdcPaymentWorker } from './submit-usdc-payment.worker'
import { SubmitWireBankAccountWorker } from './submit-wire-bank-account.worker'
import { SubmitWirePayoutWorker } from './submit-wire-payout.worker'
import { SyncCMSCacheWorker } from './sync-cms-cache.worker'
import { UpdateCcPaymentStatusWorker } from './update-cc-payment-status.worker'
import { UpdateCreditsTransferStatusWorker } from './update-credits-transfer-status.worker'
import { UpdatePaymentCardStatusWorker } from './update-payment-card-status.worker'
import { UpdateSettledPaymentWorker } from './update-settled-payment.worker'
import { UpdateUsdcPaymentStatusWorker } from './update-usdc-payment-status.worker'
import { UpdateWireBankAccountStatusWorker } from './update-wire-bank-account-status.worker'
import { UpdateWirePayoutStatusWorker } from './update-wire-payout-status.worker'
import { UploadCollectibleFilesWorker } from './upload-collectible-files.worker'

export * from './check-merchant-balance.worker'
export * from './claim-pack.worker'
export * from './generate-packs.worker'
export * from './process-expired-pack-auction-bids.worker'
export * from './process-pack-auctions.worker'
export * from './return-wire-payout.worker'
export * from './send-notification.worker'
export * from './shared-types'
export * from './submit-credits-transfer.worker'
export * from './submit-payment-card.worker'
export * from './submit-payment.worker'
export * from './submit-usdc-payment.worker'
export * from './submit-wire-bank-account.worker'
export * from './submit-wire-payout.worker'
export * from './sync-cms-cache.worker'
export * from './update-cc-payment-status.worker'
export * from './update-credits-transfer-status.worker'
export * from './update-payment-card-status.worker'
export * from './update-settled-payment.worker'
export * from './update-usdc-payment-status.worker'
export * from './update-wire-bank-account-status.worker'
export * from './update-wire-payout-status.worker'
export * from './upload-collectible-files.worker'

export const workers: BaseWorkerConstructor[] = [
  CheckMerchantBalanceWorker,
  ClaimPackWorker,
  GeneratePacksWorker,
  ProcessExpiredPackAuctionBidsWorker,
  ProcessPackAuctionsWorker,
  SubmitKycMonitorWorker,
  SendNotificationWorker,
  SubmitCreditsTransferWorker,
  SubmitPaymentCardWorker,
  SubmitPaymentWorker,
  SubmitUsdcPaymentWorker,
  SubmitWireBankAccountWorker,
  SubmitWirePayoutWorker,
  SyncCMSCacheWorker,
  UpdateCreditsTransferStatusWorker,
  UpdatePaymentCardStatusWorker,
  UpdateCcPaymentStatusWorker,
  UpdateSettledPaymentWorker,
  UpdateUsdcPaymentStatusWorker,
  UpdateWireBankAccountStatusWorker,
  UpdateWirePayoutStatusWorker,
  UploadCollectibleFilesWorker,
  ReturnWirePayoutWorker,
]
