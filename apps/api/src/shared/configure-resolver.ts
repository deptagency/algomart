import {
  AlgoExplorerAdapter,
  AlgorandAdapter,
  CircleAdapter,
  CoinbaseAdapter,
  DirectusAdapter,
  I18nAdapter,
  MailerAdapter,
  NFTStorageAdapter,
} from '@algomart/shared/adapters'
import { DependencyResolver } from '@algomart/shared/utils'
import { Configuration } from '@api/configuration'
import { logger } from '@api/configuration/logger'
import AccountsService from '@api/modules/accounts/accounts.service'
import ApplicationService from '@api/modules/application/application.service'
import AuctionsService from '@api/modules/auctions/auctions.service'
import BidsService from '@api/modules/bids/bids.service'
import CollectiblesService from '@api/modules/collectibles/collectibles.service'
import CollectionsService from '@api/modules/collections/collections.service'
import HomepageService from '@api/modules/homepage/homepage.service'
import NotificationsService from '@api/modules/notifications/notifications.service'
import PacksService from '@api/modules/packs/packs.service'
import PaymentsService from '@api/modules/payments/payments.service'
import SetsService from '@api/modules/sets/sets.service'
import TransactionsService from '@api/modules/transactions/transactions.service'

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
    DirectusAdapter.name,
    () =>
      new DirectusAdapter(
        {
          accessToken: Configuration.cmsAccessToken,
          url: Configuration.cmsUrl,
          publicUrl: Configuration.cmsPublicUrl,
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
    (c) => new AccountsService(c.get<AlgorandAdapter>(AlgorandAdapter.name))
  )
  resolver.set(
    BidsService.name,
    (c) =>
      new BidsService(
        c.get<NotificationsService>(NotificationsService.name),
        c.get<PacksService>(PacksService.name)
      )
  )
  resolver.set(
    NotificationsService.name,
    (c) =>
      new NotificationsService(
        c.get<MailerAdapter>(MailerAdapter.name),
        c.get<I18nAdapter>(I18nAdapter.name)
      )
  )
  resolver.set(I18nAdapter.name, () => new I18nAdapter())
  resolver.set(
    TransactionsService.name,
    (c) => new TransactionsService(c.get<AlgorandAdapter>(AlgorandAdapter.name))
  )
  resolver.set(
    PacksService.name,
    (c) =>
      new PacksService(
        c.get<DirectusAdapter>(DirectusAdapter.name),
        c.get<CollectiblesService>(CollectiblesService.name),
        c.get<NotificationsService>(NotificationsService.name),
        c.get<AccountsService>(AccountsService.name)
      )
  )
  resolver.set(
    CollectiblesService.name,
    (c) =>
      new CollectiblesService(
        c.get<DirectusAdapter>(DirectusAdapter.name),
        c.get<AlgorandAdapter>(AlgorandAdapter.name),
        c.get<NFTStorageAdapter>(NFTStorageAdapter.name),
        c.get<AlgoExplorerAdapter>(AlgoExplorerAdapter.name)
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
        c.get<CircleAdapter>(CircleAdapter.name),
        c.get<CoinbaseAdapter>(CoinbaseAdapter.name),
        c.get<NotificationsService>(NotificationsService.name),
        c.get<PacksService>(PacksService.name)
      )
  )
  resolver.set(
    SetsService.name,
    (c) => new SetsService(c.get<DirectusAdapter>(DirectusAdapter.name))
  )
  resolver.set(
    CollectionsService.name,
    (c) => new CollectionsService(c.get<DirectusAdapter>(DirectusAdapter.name))
  )
  resolver.set(
    HomepageService.name,
    (c) =>
      new HomepageService(
        c.get<DirectusAdapter>(DirectusAdapter.name),
        c.get<PacksService>(PacksService.name),
        c.get<CollectiblesService>(CollectiblesService.name)
      )
  )
  resolver.set(
    AuctionsService.name,
    (c) => new AuctionsService(c.get<AlgorandAdapter>(AlgorandAdapter.name))
  )
  resolver.set(
    ApplicationService.name,
    (c) => new ApplicationService(c.get<DirectusAdapter>(DirectusAdapter.name))
  )
  return resolver
}
