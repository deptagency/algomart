import {
  AlgorandAdapter,
  AlgorandAdapterOptions,
  ChainalysisAdapter,
  ChainalysisAdapterOptions,
  CircleAdapter,
  CircleAdapterOptions,
  CoinbaseAdapter,
  DirectusAdapter,
  DirectusAdapterOptions,
  I18nAdapter,
  IpGeolocationAdapter,
  IpGeolocationAdapterOptions,
  MailerAdapter,
  MailerAdapterOptions,
  NFTStorageAdapter,
  NFTStorageAdapterOptions,
  OnfidoAdapter,
  OnfidoAdapterOptions,
} from '@algomart/shared/adapters'
import {
  BaseQueue,
  ClaimPackQueue,
  GeneratePacksQueue,
  queues,
  ReturnWirePayoutQueue,
  SendNotificationQueue,
  SubmitCreditsTransferQueue,
  SubmitKycMonitorQueue,
  SubmitPaymentCardQueue,
  SubmitPaymentQueue,
  SubmitUsdcPaymentQueue,
  SubmitWireBankAccountQueue,
  SubmitWirePayoutQueue,
  UpdateCcPaymentStatusQueue,
  UpdateCreditsTransferStatusQueue,
  UpdatePaymentCardStatusQueue,
  UpdateSettledPaymentQueue,
  UpdateUsdcPaymentStatusQueue,
  UpdateWireBankAccountStatusQueue,
  UpdateWirePayoutStatusQueue,
  UploadCollectibleFilesQueue,
} from '@algomart/shared/queues'
import { createLogger, DependencyResolver } from '@algomart/shared/utils'
import { Currency, USD } from '@dinero.js/currencies'
import Redis from 'ioredis'
import { Logger } from 'pino'

import { AccountsService } from '../accounts.service'
import { AlgorandTransactionsService } from '../algorand-transactions.service'
import { ApplicationService } from '../application.service'
import { BidsService } from '../bids.service'
import { CheckMerchantBalanceService } from '../check-merchant-balance.service'
import { CircleWebhookService } from '../circle-webhook.service'
import { ClaimPackService } from '../claim-pack/claim-pack.service'
import { CMSCacheService } from '../cms-cache.service'
import { CollectiblesService } from '../collectibles.service'
import { CollectionsService } from '../collections.service'
import { FaqsService } from '../faqs.service'
import { GeneratorService } from '../generator.service'
import { HomepageService } from '../homepage.service'
import { I18nService } from '../i18n.service'
import { MarketplaceService } from '../marketplace/marketplace.service'
import { NotificationsService } from '../notifications.service'
import { PackAuctionService } from '../pack-auction.service'
import { PacksService } from '../packs.service'
import { PaymentCardService } from '../payment-card.service'
import { PaymentsService } from '../payments/payments.service'
import { PayoutService } from '../payout/payout.service'
import { SetsService } from '../sets.service'
import { UserAccountTransfersService } from '../user-account-transfers/user-account-transfers.service'
import { WiresService } from '../wires/wires.service'

export type ResolverOptions = {
  logger: Logger
  redis: Redis.Redis
  currency: Currency<number>
  isKYCEnabled: boolean
  royaltyBasisPoints: number
  minimumDaysBetweenTransfers: number
  minimumDaysBeforeCashout: number
}

// #region mock options

// These cannot be in the adapter mocks, as this file cannot import jest/globals
export const mockAlgorandAdapterOptions: AlgorandAdapterOptions = {
  algodPort: 1,
  algodServer: 'https://www.example.com',
  algodToken: '',
  indexerPort: 1,
  indexerServer: 'https://www.example.com',
  indexerToken: '',
  // this is the "throw away account" defined in .github/workflows/continuous-integration.yml
  fundingMnemonic:
    'unveil wrist wreck stool drop lamp modify slot magnet purse naive glow public author panther mercy derive script shuffle lend equal start quiz above vague',
  appSecret: '',
  enforcerAppID: 1,
  coldKeyAddress: '',
}

export const mockChainalysisAdapterOptions: ChainalysisAdapterOptions = {
  apiKey: '1',
  url: 'https://www.example.com',
}

export const mockIpGeolocationAdapterOptions: IpGeolocationAdapterOptions = {
  apiKey: '1',
  url: 'https://www.example.com',
}

export const mockCircleAdapterOptions: CircleAdapterOptions = {
  apiKey: '',
  url: 'https://www.example.com',
}

export const mockCMSCacheServiceOptions = {
  cmsUrl: 'http://localhost',
  gcpCdnUrl: 'http://localhost',
}

export const mockGeneratorServiceOptions = {
  cmsUrl: 'http://localhost',
  gcpCdnUrl: 'http://localhost',
}

export const mockDirectusAdapterOptions: DirectusAdapterOptions = {
  accessToken: 'mock-access-token',
  cmsUrl: 'http://localhost',
}

export const mockMailerAdapterOptions: MailerAdapterOptions = {
  emailFrom: 'from@email.local',
  emailName: 'Test Email Name',
  emailTransport: 'smtp',
  smtpHost: 'localhost',
  smtpPassword: 'fake-smtp-password',
  smtpPort: 345,
  smtpUser: 'fake-smtp-user',
}

export const mockNFTStorageAdapterOptions: NFTStorageAdapterOptions = {
  cmsUrl: 'http://localhost',
  enforcerAppID: 1,
  pinataApiKey: 'fake-pinata-api-key',
  pinataApiSecret: 'fake-pinata-api-secret',
  webUrl: 'http://localhost',
}

export const mockOnfidoAdapterOptions: OnfidoAdapterOptions = {
  isEnabled: true,
  url: 'https://fake-onfido.com',
  token: 'fake-token',
  onboardingWorkflowId: 'fake-workflow-id',
  webhookToken: 'fake-webhook-token',
  webUrl: 'https://fake-website.com',
  cmsUrl: 'https://fake-cms.com',
}

// #endregion

export async function closeQueues(resolver: DependencyResolver) {
  for (const BaseQueue of queues) {
    const queue = resolver.get<BaseQueue>(BaseQueue.name)
    await queue.close()
  }
}

export function configureTestResolver({
  logger = createLogger('info', false),
  currency = USD,
  isKYCEnabled = false,
  minimumDaysBetweenTransfers = 7,
  minimumDaysBeforeCashout = 7,
  redis = new Redis(process.env.TEST_REDIS_URL, { maxRetriesPerRequest: null }),
  royaltyBasisPoints = 500,
}: Partial<ResolverOptions> = {}) {
  // Hide console warnings for Redis connections
  redis.setMaxListeners(0)

  const resolver = new DependencyResolver()

  // Configure all queues
  // Note: do not configure workers here, they cannot be tested in the services lib
  queues.map((BaseQueue) => {
    resolver.set(BaseQueue.name, (c) => BaseQueue.create(c))
  })

  resolver.set(
    AlgorandAdapter.name,
    () => new AlgorandAdapter(mockAlgorandAdapterOptions, logger)
  )
  resolver.set('LOGGER', () => logger)
  resolver.set('JOBS_REDIS', () => redis)
  resolver.set('CACHE_REDIS', () => redis)
  resolver.set('RATE_LIMIT_REDIS', () => redis)
  resolver.set(
    PaymentCardService.name,
    (c) =>
      new PaymentCardService(
        c.get(CircleAdapter.name),
        c.get<SubmitPaymentCardQueue>(SubmitPaymentCardQueue.name),
        c.get<UpdatePaymentCardStatusQueue>(UpdatePaymentCardStatusQueue.name)
      )
  )
  resolver.set(
    GeneratorService.name,
    (c) =>
      new GeneratorService(
        mockGeneratorServiceOptions,
        c.get<NFTStorageAdapter>(NFTStorageAdapter.name),
        c.get<GeneratePacksQueue>(GeneratePacksQueue.name),
        c.get<UploadCollectibleFilesQueue>(UploadCollectibleFilesQueue.name)
      )
  )
  resolver.set(
    CMSCacheService.name,
    (c) =>
      new CMSCacheService(
        mockCMSCacheServiceOptions,
        c.get<DirectusAdapter>(DirectusAdapter.name),
        c.get<GeneratorService>(GeneratorService.name),
        logger
      )
  )
  resolver.set(
    DirectusAdapter.name,
    () => new DirectusAdapter(mockDirectusAdapterOptions, logger)
  )
  resolver.set(
    NFTStorageAdapter.name,
    () => new NFTStorageAdapter(mockNFTStorageAdapterOptions, logger)
  )
  resolver.set(
    MailerAdapter.name,
    () => new MailerAdapter(mockMailerAdapterOptions, logger)
  )
  resolver.set(
    OnfidoAdapter.name,
    () => new OnfidoAdapter(mockOnfidoAdapterOptions, logger)
  )
  resolver.set(
    UserAccountTransfersService.name,
    (c) =>
      new UserAccountTransfersService(
        mockCMSCacheServiceOptions,
        c.get(CircleAdapter.name),
        c.get<SubmitCreditsTransferQueue>(SubmitCreditsTransferQueue.name),
        c.get<UpdateCreditsTransferStatusQueue>(
          UpdateCreditsTransferStatusQueue.name
        ),
        logger
      )
  )
  resolver.set(
    PackAuctionService.name,
    (c) =>
      new PackAuctionService(
        {
          currency,
        },
        c.get<CMSCacheService>(CMSCacheService.name),
        c.get<NotificationsService>(NotificationsService.name),
        logger
      )
  )
  resolver.set(
    AccountsService.name,
    (c) =>
      new AccountsService(
        c.get<AlgorandAdapter>(AlgorandAdapter.name),
        c.get<IpGeolocationAdapter>(IpGeolocationAdapter.name),
        c.get<OnfidoAdapter>(OnfidoAdapter.name),
        c.get<PaymentsService>(PaymentsService.name),
        c.get<NotificationsService>(NotificationsService.name),
        c.get<AlgorandTransactionsService>(AlgorandTransactionsService.name),
        c.get<SubmitKycMonitorQueue>(SubmitKycMonitorQueue.name),
        logger
      )
  )
  resolver.set(
    BidsService.name,
    (c) =>
      new BidsService(
        c.get<NotificationsService>(NotificationsService.name),
        c.get<PacksService>(PacksService.name),
        logger
      )
  )
  resolver.set(
    NotificationsService.name,
    (c) =>
      new NotificationsService(
        {
          webUrl: 'http://localhost',
          customerServiceEmail: 'support@test.local',
        },
        c.get<MailerAdapter>(MailerAdapter.name),
        c.get<I18nAdapter>(I18nAdapter.name),
        c.get<SendNotificationQueue>(SendNotificationQueue.name),
        logger
      )
  )
  resolver.set(I18nAdapter.name, () => new I18nAdapter('test'))
  resolver.set(
    PacksService.name,
    (c) =>
      new PacksService(
        c.get<CMSCacheService>(CMSCacheService.name),
        c.get<CollectiblesService>(CollectiblesService.name),
        c.get<NotificationsService>(NotificationsService.name),
        c.get<ClaimPackQueue>(ClaimPackQueue.name),
        logger
      )
  )
  resolver.set(
    AlgorandTransactionsService.name,
    (c) => new AlgorandTransactionsService(c.get(AlgorandAdapter.name))
  )
  resolver.set(
    MarketplaceService.name,
    (c) =>
      new MarketplaceService(
        {
          minimumDaysBetweenTransfers,
          royaltyBasisPoints,
          ...mockCMSCacheServiceOptions,
        },
        c.get<AlgorandAdapter>(AlgorandAdapter.name),
        c.get<UserAccountTransfersService>(UserAccountTransfersService.name),
        c.get<AlgorandTransactionsService>(AlgorandTransactionsService.name),
        c.get<AccountsService>(AccountsService.name),
        c.get<PaymentsService>(PaymentsService.name)
      )
  )
  resolver.set(
    CollectiblesService.name,
    (c) =>
      new CollectiblesService(
        {
          minimumDaysBetweenTransfers,
        },
        c.get<CMSCacheService>(CMSCacheService.name),
        c.get<AlgorandAdapter>(AlgorandAdapter.name),
        c.get<AlgorandTransactionsService>(AlgorandTransactionsService.name),
        logger
      )
  )
  resolver.set(
    CircleAdapter.name,
    () => new CircleAdapter(mockCircleAdapterOptions, logger)
  )
  resolver.set(
    CoinbaseAdapter.name,
    () =>
      new CoinbaseAdapter(
        {
          url: 'https://api.coinbase.com',
        },
        logger
      )
  )
  resolver.set(
    ChainalysisAdapter.name,
    () => new ChainalysisAdapter(mockChainalysisAdapterOptions, logger)
  )
  resolver.set(
    IpGeolocationAdapter.name,
    () => new IpGeolocationAdapter(mockIpGeolocationAdapterOptions, logger)
  )
  resolver.set(
    PaymentsService.name,
    (c) =>
      new PaymentsService(
        {
          royaltyBasisPoints,
          minimumDaysBetweenTransfers,
          webUrl: 'http://localhost',
          currency,
          customerServiceEmail: 'support@test.local',
          isKYCEnabled,
          algorandEnvironment: 'testnet',
        },
        c.get<CircleAdapter>(CircleAdapter.name),
        c.get<PacksService>(PacksService.name),
        c.get<UserAccountTransfersService>(UserAccountTransfersService.name),
        c.get<SubmitPaymentQueue>(SubmitPaymentQueue.name),
        c.get<SubmitUsdcPaymentQueue>(SubmitUsdcPaymentQueue.name),
        c.get<AlgorandTransactionsService>(AlgorandTransactionsService.name),
        c.get<UpdateCcPaymentStatusQueue>(UpdateCcPaymentStatusQueue.name),
        c.get<UpdateSettledPaymentQueue>(UpdateSettledPaymentQueue.name),
        c.get<UpdateUsdcPaymentStatusQueue>(UpdateUsdcPaymentStatusQueue.name),
        c.get<ChainalysisAdapter>(ChainalysisAdapter.name),
        logger
      )
  )
  resolver.set(
    ClaimPackService.name,
    (c) =>
      new ClaimPackService(
        c.get<AlgorandAdapter>(AlgorandAdapter.name),
        c.get<CMSCacheService>(CMSCacheService.name),
        c.get<NotificationsService>(NotificationsService.name),
        c.get<AlgorandTransactionsService>(AlgorandTransactionsService.name),
        c.get<AccountsService>(AccountsService.name)
      )
  )
  resolver.set(
    SetsService.name,
    (c) => new SetsService(c.get<CMSCacheService>(CMSCacheService.name), logger)
  )
  resolver.set(
    CollectionsService.name,
    (c) =>
      new CollectionsService(
        c.get<CMSCacheService>(CMSCacheService.name),
        logger
      )
  )
  resolver.set(
    HomepageService.name,
    (c) =>
      new HomepageService(
        c.get<CMSCacheService>(CMSCacheService.name),
        c.get<PacksService>(PacksService.name)
      )
  )
  resolver.set(
    FaqsService.name,
    (c) => new FaqsService(c.get<CMSCacheService>(CMSCacheService.name), logger)
  )
  resolver.set(
    ApplicationService.name,
    (c) =>
      new ApplicationService(
        c.get<CMSCacheService>(CMSCacheService.name),
        logger
      )
  )
  resolver.set(
    I18nService.name,
    (c) =>
      new I18nService(
        {
          currency,
        },
        c.get<CMSCacheService>(CMSCacheService.name),
        c.get<CoinbaseAdapter>(CoinbaseAdapter.name),
        logger
      )
  )
  resolver.set(
    CheckMerchantBalanceService.name,
    (c) =>
      new CheckMerchantBalanceService(
        {
          notificationEmail: 'support@test.local',
          usdThreshold: '1000.00',
        },
        c.get(CircleAdapter.name),
        c.get(MailerAdapter.name),
        logger
      )
  )
  resolver.set(
    PayoutService.name,
    (c) =>
      new PayoutService(
        {
          minimumDaysBeforeCashout,
        },
        c.get<UserAccountTransfersService>(UserAccountTransfersService.name),
        c.get<AccountsService>(AccountsService.name),
        c.get<OnfidoAdapter>(OnfidoAdapter.name),
        c.get<PaymentsService>(PaymentsService.name),
        c.get<NotificationsService>(NotificationsService.name),
        c.get<SubmitWirePayoutQueue>(SubmitWirePayoutQueue.name),
        c.get<UpdateWirePayoutStatusQueue>(UpdateWirePayoutStatusQueue.name),
        c.get<ReturnWirePayoutQueue>(ReturnWirePayoutQueue.name),
        c.get<CircleAdapter>(CircleAdapter.name),
        logger
      )
  )
  resolver.set(
    CircleWebhookService.name,
    (c) =>
      new CircleWebhookService(
        c.get<CircleAdapter>(CircleAdapter.name),
        c.get<PaymentCardService>(PaymentCardService.name),
        c.get<PaymentsService>(PaymentsService.name),
        c.get<UserAccountTransfersService>(UserAccountTransfersService.name),
        c.get<WiresService>(WiresService.name),
        c.get<PayoutService>(PayoutService.name),
        logger
      )
  )

  resolver.set(
    WiresService.name,
    (c) =>
      new WiresService(
        c.get<CircleAdapter>(CircleAdapter.name),
        c.get<SubmitWireBankAccountQueue>(SubmitWireBankAccountQueue.name),
        c.get<UpdateWireBankAccountStatusQueue>(
          UpdateWireBankAccountStatusQueue.name
        ),
        logger
      )
  )

  return resolver
}
