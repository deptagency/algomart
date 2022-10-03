import {
  AlgorandAdapter,
  ChainalysisAdapter,
  CircleAdapter,
  CoinbaseAdapter,
  DirectusAdapter,
  I18nAdapter,
  IpGeolocationAdapter,
  MailerAdapter,
  NFTStorageAdapter,
  OnfidoAdapter,
  VaultAdapter,
} from '@algomart/shared/adapters'
import {
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
import {
  AccountsService,
  AlgorandTransactionsService,
  ApplicationService,
  BidsService,
  CheckMerchantBalanceService,
  ClaimPackService,
  CMSCacheService,
  CollectiblesService,
  CollectionsService,
  FaqsService,
  GeneratorService,
  HomepageService,
  I18nService,
  MarketplaceService,
  NotificationsService,
  PackAuctionService,
  PacksService,
  PaymentCardService,
  PaymentsService,
  PayoutService,
  SetsService,
  UserAccountTransfersService,
  WiresService,
} from '@algomart/shared/services'
import { DependencyResolver } from '@algomart/shared/utils'
import { workers } from '@algomart/shared/workers'
import Redis from 'ioredis'

import { logger } from './logger'
import { Configuration } from './'

export function configureResolver() {
  const resolver = new DependencyResolver()

  if (Configuration.vault.enabled) {
    resolver.set(
      VaultAdapter.name,
      () =>
        new VaultAdapter(
          {
            address: Configuration.vault.address,
            transitPath: Configuration.vault.encryption.transitPath,
            encryptionKeyName: Configuration.vault.encryption.keyName,
            gcpAuthRoleName: Configuration.vault.gcpAuthRoleName,
            gcpServiceAccountEmail: Configuration.vault.gcpServiceAccountEmail,
          },
          logger
        )
    )
  }
  // Configure all queues
  queues.map((BaseQueue) => {
    resolver.set(BaseQueue.name, (c) => BaseQueue.create(c))
  })

  // Configure all workers
  workers.map((BaseWorker) => {
    resolver.set(BaseWorker.name, (c) => BaseWorker.create(c))
  })

  resolver.set(
    AlgorandAdapter.name,
    (c) =>
      new AlgorandAdapter(
        {
          algodPort: Configuration.algodPort,
          algodServer: Configuration.algodServer,
          algodToken: Configuration.algodToken,
          indexerPort: Configuration.indexerPort,
          indexerServer: Configuration.indexerServer,
          indexerToken: Configuration.indexerToken,
          fundingMnemonic: Configuration.fundingMnemonic,
          enforcerAppID: Configuration.enforcerAppID,
          appSecret: Configuration.secret,
          coldKeyAddress: Configuration.coldKeyAddress,
          ...(Configuration.vault.enabled &&
          Configuration.vault.encryption.enabled
            ? {
                encryptionFunction: c.get<VaultAdapter>(VaultAdapter.name)
                  .encryptMnemonic,
                decryptionFunction: c.get<VaultAdapter>(VaultAdapter.name)
                  .decryptMnemonic,
              }
            : {}),
        },
        logger
      )
  )
  resolver.set('LOGGER', () => logger)
  resolver.set(
    'JOBS_REDIS',
    () =>
      new Redis(Configuration.jobsRedis.url, {
        maxRetriesPerRequest: null,
        lazyConnect: true,
        // Fail fast if Redis is down
        enableOfflineQueue: false,
      }),
    // Always create a new instance of the Redis client for jobs
    false
  )
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
        {
          cmsUrl: Configuration.cmsUrl,
          gcpCdnUrl: Configuration.gcpCdnUrl,
        },
        c.get<NFTStorageAdapter>(NFTStorageAdapter.name),
        c.get<GeneratePacksQueue>(GeneratePacksQueue.name),
        c.get<UploadCollectibleFilesQueue>(UploadCollectibleFilesQueue.name)
      )
  )
  resolver.set(
    CMSCacheService.name,
    (c) =>
      new CMSCacheService(
        {
          cmsUrl: Configuration.cmsUrl,
          gcpCdnUrl: Configuration.gcpCdnUrl,
        },
        c.get<DirectusAdapter>(DirectusAdapter.name),
        c.get<GeneratorService>(GeneratorService.name),
        logger
      )
  )
  resolver.set(
    DirectusAdapter.name,
    () =>
      new DirectusAdapter(
        {
          cmsUrl: Configuration.cmsUrl,
          accessToken: Configuration.cmsAccessToken,
        },
        logger
      )
  )
  resolver.set(
    NFTStorageAdapter.name,
    () =>
      new NFTStorageAdapter(
        {
          pinataApiKey: Configuration.pinataApiKey,
          pinataApiSecret: Configuration.pinataApiSecret,
          cmsUrl: Configuration.cmsUrl,
          webUrl: Configuration.webUrl,
          enforcerAppID: Configuration.enforcerAppID,
        },
        logger
      )
  )
  resolver.set(
    MailerAdapter.name,
    () => new MailerAdapter(Configuration.mailer, logger)
  )
  resolver.set(
    OnfidoAdapter.name,
    () => new OnfidoAdapter(Configuration.onfidoAdapterOptions, logger)
  )
  resolver.set(
    UserAccountTransfersService.name,
    (c) =>
      new UserAccountTransfersService(
        {
          cmsUrl: Configuration.cmsUrl,
          gcpCdnUrl: Configuration.gcpCdnUrl,
        },
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
          currency: Configuration.currency,
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
    PayoutService.name,
    (c) =>
      new PayoutService(
        {
          minimumDaysBeforeCashout: Configuration.minimumDaysBeforeCashout,
        },
        c.get(UserAccountTransfersService.name),
        c.get(AccountsService.name),
        c.get(OnfidoAdapter.name),
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
          webUrl: Configuration.webUrl,
          customerServiceEmail: Configuration.customerServiceEmail,
        },
        c.get<MailerAdapter>(MailerAdapter.name),
        c.get<I18nAdapter>(I18nAdapter.name),
        c.get<SendNotificationQueue>(SendNotificationQueue.name),
        logger
      )
  )
  resolver.set(I18nAdapter.name, () => new I18nAdapter(Configuration.env))
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
          minimumDaysBetweenTransfers:
            Configuration.minimumDaysBetweenTransfers,
          royaltyBasisPoints: Configuration.royaltyBasisPoints,
          cmsUrl: Configuration.cmsUrl,
          gcpCdnUrl: Configuration.gcpCdnUrl,
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
          minimumDaysBetweenTransfers:
            Configuration.minimumDaysBetweenTransfers,
        },
        c.get<CMSCacheService>(CMSCacheService.name),
        c.get<AlgorandAdapter>(AlgorandAdapter.name),
        c.get<AlgorandTransactionsService>(AlgorandTransactionsService.name),
        logger
      )
  )
  resolver.set(
    CircleAdapter.name,
    () =>
      new CircleAdapter(
        {
          apiKey: Configuration.circleApiKey,
          url: Configuration.circleUrl,
        },
        logger
      )
  )
  resolver.set(
    CoinbaseAdapter.name,
    () =>
      new CoinbaseAdapter(
        {
          url: Configuration.coinbaseUrl,
        },
        logger
      )
  )
  resolver.set(
    ChainalysisAdapter.name,
    () =>
      new ChainalysisAdapter(
        {
          apiKey: Configuration.chainalysisApiKey,
          url: Configuration.chainalysisUrl,
        },
        logger
      )
  )
  resolver.set(
    IpGeolocationAdapter.name,
    () =>
      new IpGeolocationAdapter(
        {
          apiKey: Configuration.ipGeolocationApiKey,
          url: Configuration.ipGeolocationUrl,
        },
        logger
      )
  )
  resolver.set(
    PaymentsService.name,
    (c) =>
      new PaymentsService(
        {
          royaltyBasisPoints: Configuration.royaltyBasisPoints,
          minimumDaysBetweenTransfers:
            Configuration.minimumDaysBetweenTransfers,
          webUrl: Configuration.webUrl,
          currency: Configuration.currency,
          customerServiceEmail: Configuration.customerServiceEmail,
          isKYCEnabled: Configuration.isKYCEnabled,
          algorandEnvironment: Configuration.algorandEnvironment,
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
          currency: Configuration.currency,
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
        Configuration.merchantWalletBalance,
        c.get(CircleAdapter.name),
        c.get(MailerAdapter.name),
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
