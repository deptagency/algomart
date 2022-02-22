import { DependencyResolver } from '@algomart/shared/utils'
import { Configuration } from './'
import { MailerAdapter } from '@algomart/shared/adapters'
import { logger } from './logger'

export function configureResolver() {
  const resolver = new DependencyResolver()
  // // resolver.set(
  // //   AlgorandAdapter.name,
  // //   () =>
  // //     new AlgorandAdapter({
  // //       algodPort: Configuration.algodPort,
  // //       algodServer: Configuration.algodServer,
  // //       algodToken: Configuration.algodToken,
  // //       fundingMnemonic: Configuration.fundingMnemonic,
  // //     })
  // // )
  // // resolver.set(AlgoExplorerAdapter.name, () => new AlgoExplorerAdapter())
  // // resolver.set(
  // //   DirectusAdapter.name,
  // //   () =>
  // //     new DirectusAdapter({
  // //       accessToken: Configuration.cmsAccessToken,
  // //       url: Configuration.cmsUrl,
  // //     })
  // // )
  // // resolver.set(
  // //   NFTStorageAdapter.name,
  // //   () =>
  // //     new NFTStorageAdapter({
  // //       pinataApiKey: Configuration.pinataApiKey,
  // //       pinataApiSecret: Configuration.pinataApiSecret,
  // //     })
  // // )

  resolver.set(
    MailerAdapter.name,
    () => new MailerAdapter(Configuration.mailer, logger)
  )
  // // resolver.set(
  // //   AccountsService.name,
  // //   (c) => new AccountsService(c.get<AlgorandAdapter>(AlgorandAdapter.name))
  // // )
  // // resolver.set(
  // //   BidsService.name,
  // //   (c) =>
  // //     new BidsService(
  // //       c.get<NotificationsService>(NotificationsService.name),
  // //       c.get<PacksService>(PacksService.name)
  // //     )
  // // )
  // // resolver.set(
  // //   NotificationsService.name,
  // //   (c) =>
  // //     new NotificationsService(
  // //       c.get<MailerAdapter>(MailerAdapter.name),
  // //       c.get<I18nAdapter>(I18nAdapter.name)
  // //     )
  // // )
  // // resolver.set(I18nAdapter.name, () => new I18nAdapter())
  // // resolver.set(
  // //   TransactionsService.name,
  // //   (c) => new TransactionsService(c.get<AlgorandAdapter>(AlgorandAdapter.name))
  // // )
  // // resolver.set(
  // //   PacksService.name,
  // //   (c) =>
  // //     new PacksService(
  // //       c.get<DirectusAdapter>(DirectusAdapter.name),
  // //       c.get<CollectiblesService>(CollectiblesService.name),
  // //       c.get<NotificationsService>(NotificationsService.name),
  // //       c.get<AccountsService>(AccountsService.name)
  // //     )
  // // )
  // // resolver.set(
  // //   CollectiblesService.name,
  // //   (c) =>
  // //     new CollectiblesService(
  // //       c.get<DirectusAdapter>(DirectusAdapter.name),
  // //       c.get<AlgorandAdapter>(AlgorandAdapter.name),
  // //       c.get<NFTStorageAdapter>(NFTStorageAdapter.name),
  // //       c.get<AlgoExplorerAdapter>(AlgoExplorerAdapter.name)
  // //     )
  // // )
  // // resolver.set(
  // //   CircleAdapter.name,
  // //   () =>
  // //     new CircleAdapter({
  // //       apiKey: Configuration.circleApiKey,
  // //       url: Configuration.circleUrl,
  // //     })
  // // )
  // // resolver.set(
  // //   CoinbaseAdapter.name,
  // //   () =>
  // //     new CoinbaseAdapter({
  // //       url: Configuration.coinbaseUrl,
  // //     })
  // // )
  // // resolver.set(
  // //   PaymentsService.name,
  // //   (c) =>
  // //     new PaymentsService(
  // //       c.get<CircleAdapter>(CircleAdapter.name),
  // //       c.get<CoinbaseAdapter>(CoinbaseAdapter.name),
  // //       c.get<NotificationsService>(NotificationsService.name),
  // //       c.get<PacksService>(PacksService.name)
  // //     )
  // // )
  // // resolver.set(
  // //   SetsService.name,
  // //   (c) => new SetsService(c.get<DirectusAdapter>(DirectusAdapter.name))
  // // )
  // // resolver.set(
  // //   CollectionsService.name,
  // //   (c) => new CollectionsService(c.get<DirectusAdapter>(DirectusAdapter.name))
  // // )
  // // resolver.set(
  // //   HomepageService.name,
  // //   (c) =>
  // //     new HomepageService(
  // //       c.get<DirectusAdapter>(DirectusAdapter.name),
  // //       c.get<PacksService>(PacksService.name),
  // //       c.get<CollectiblesService>(CollectiblesService.name)
  // //     )
  // // )
  // // resolver.set(
  // //   FaqsService.name,
  // //   (c) => new FaqsService(c.get<DirectusAdapter>(DirectusAdapter.name))
  // // )
  // // resolver.set(
  // //   AuctionsService.name,
  // //   (c) => new AuctionsService(c.get<AlgorandAdapter>(AlgorandAdapter.name))
  // // )

  // // resolver.set(
  // //   DirectusPageService.name,
  // //   (c) => new DirectusPageService(c.get<DirectusAdapter>(DirectusAdapter.name))
  // // )

  // // resolver.set(
  // //   LanguagesService.name,
  // //   (c) => new LanguagesService(c.get<DirectusAdapter>(DirectusAdapter.name))
  // // )
  return resolver
}
