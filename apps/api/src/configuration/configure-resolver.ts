import {
  AlgoExplorerAdapter,
  AlgorandAdapter,
  CircleAdapter,
  CMSCacheAdapter,
  CoinbaseAdapter,
  I18nAdapter,
  MailerAdapter,
  NFTStorageAdapter,
} from '@algomart/shared/adapters'
import {
  AccountsService,
  ApplicationService,
  AuctionsService,
  BidsService,
  CollectiblesService,
  CollectionsService,
  HomepageService,
  NotificationsService,
  PacksService,
  PaymentsService,
  SetsService,
  TransactionsService,
} from '@algomart/shared/services'
import { DependencyResolver } from '@algomart/shared/utils'
import { Configuration } from '@api/configuration'
import { logger } from '@api/configuration/logger'

export function configureResolver() {
  const resolver = new DependencyResolver()
  resolver.set(
    AlgorandAdapter.name,
    () =>
      new AlgorandAdapter(
        {
          algodPort: Configuration.algodPort,
          algodServer: Configuration.algodServer,
          algodToken: Configuration.algodToken,
          fundingMnemonic: Configuration.fundingMnemonic,
          appSecret: Configuration.secret,
        },
        logger
      )
  )
  resolver.set(
    AlgoExplorerAdapter.name,
    () => new AlgoExplorerAdapter(Configuration.algodEnv, logger)
  )
  resolver.set(
    CMSCacheAdapter.name,
    () =>
      new CMSCacheAdapter(
        {
          cmsUrl: Configuration.cmsUrl,
          gcpCdnUrl: Configuration.gcpCdnUrl,
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
          cmsPublicUrl: Configuration.cmsPublicUrl,
          webUrl: Configuration.webUrl,
        },
        logger
      )
  )
  resolver.set(
    MailerAdapter.name,
    () => new MailerAdapter(Configuration.mailer, logger)
  )
  resolver.set(
    AccountsService.name,
    (c) =>
      new AccountsService(c.get<AlgorandAdapter>(AlgorandAdapter.name), logger)
  )
  resolver.set(
    BidsService.name,
    (c) =>
      new BidsService(
        c.get<NotificationsService>(NotificationsService.name),
        c.get<PacksService>(PacksService.name),
        Configuration.currency,
        logger
      )
  )
  resolver.set(
    NotificationsService.name,
    (c) =>
      new NotificationsService(
        c.get<MailerAdapter>(MailerAdapter.name),
        c.get<I18nAdapter>(I18nAdapter.name),
        Configuration.webUrl,
        Configuration.customerServiceEmail,
        logger
      )
  )
  resolver.set(I18nAdapter.name, () => new I18nAdapter())
  resolver.set(
    TransactionsService.name,
    (c) =>
      new TransactionsService(
        c.get<AlgorandAdapter>(AlgorandAdapter.name),
        logger
      )
  )
  resolver.set(
    PacksService.name,
    (c) =>
      new PacksService(
        c.get<CMSCacheAdapter>(CMSCacheAdapter.name),
        c.get<CollectiblesService>(CollectiblesService.name),
        c.get<NotificationsService>(NotificationsService.name),
        c.get<AccountsService>(AccountsService.name),
        Configuration.currency,
        logger
      )
  )
  resolver.set(
    CollectiblesService.name,
    (c) =>
      new CollectiblesService(
        c.get<CMSCacheAdapter>(CMSCacheAdapter.name),
        c.get<AlgorandAdapter>(AlgorandAdapter.name),
        c.get<NFTStorageAdapter>(NFTStorageAdapter.name),
        c.get<AlgoExplorerAdapter>(AlgoExplorerAdapter.name),
        Configuration.minimumDaysBeforeTransfer,
        Configuration.creatorPassphrase,
        Configuration.cmsPublicUrl,
        Configuration.cmsUrl,
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
    PaymentsService.name,
    (c) =>
      new PaymentsService(
        {
          webUrl: Configuration.webUrl,
          successPath: Configuration.successPath,
          failurePath: Configuration.failurePath,
          currency: Configuration.currency,
          customerServiceEmail: Configuration.customerServiceEmail,
        },
        c.get<CircleAdapter>(CircleAdapter.name),
        c.get<CoinbaseAdapter>(CoinbaseAdapter.name),
        c.get<NotificationsService>(NotificationsService.name),
        c.get<PacksService>(PacksService.name),
        logger
      )
  )
  resolver.set(
    SetsService.name,
    (c) => new SetsService(c.get<CMSCacheAdapter>(CMSCacheAdapter.name), logger)
  )
  resolver.set(
    CollectionsService.name,
    (c) =>
      new CollectionsService(
        c.get<CMSCacheAdapter>(CMSCacheAdapter.name),
        logger
      )
  )
  resolver.set(
    HomepageService.name,
    (c) =>
      new HomepageService(
        c.get<CMSCacheAdapter>(CMSCacheAdapter.name),
        c.get<PacksService>(PacksService.name)
      )
  )
  resolver.set(
    AuctionsService.name,
    (c) =>
      new AuctionsService(c.get<AlgorandAdapter>(AlgorandAdapter.name), logger)
  )
  resolver.set(
    ApplicationService.name,
    (c) =>
      new ApplicationService(
        c.get<CMSCacheAdapter>(CMSCacheAdapter.name),
        logger
      )
  )
  return resolver
}
