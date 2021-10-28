import { Configuration } from '@/configuration'
import AlgorandAdapter from '@/lib/algorand-adapter'
import CircleAdapter from '@/lib/circle-adapter'
import CoinbaseAdapter from '@/lib/coinbase-adapter'
import DirectusAdapter from '@/lib/directus-adapter'
import SendgridAdapter from '@/lib/sendgrid-adapter'
import AccountsService from '@/modules/accounts/accounts.service'
import BidsService from '@/modules/bids/bids.service'
import CollectiblesService from '@/modules/collectibles/collectibles.service'
import CollectionsService from '@/modules/collections/collections.service'
import HomepageService from '@/modules/homepage/homepage.service'
import NotificationsService from '@/modules/notifications/notifications.service'
import PacksService from '@/modules/packs/packs.service'
import PaymentsService from '@/modules/payments/payments.service'
import SetsService from '@/modules/sets/sets.service'
import TransactionsService from '@/modules/transactions/transactions.service'

export interface Factory<T> {
  (resolver: DependencyResolver): T
}

export interface ResolverItem<T> {
  singleton: boolean
  create: Factory<T>
}

/**
 * This is a _very_ basic dependency resolver. By default it will cache the
 * resolved instance, virtually turning them into singletons.
 */
export default class DependencyResolver {
  private store: Map<string, ResolverItem<unknown>> = new Map()
  private cache: Map<string, unknown> = new Map()

  /**
   * Sets the factory for the given identifier. Will override the previous one if present.
   * @param identifier Any string will work, but it's recommended to use the class name.
   * @param create A factory function that will create the instance.
   * @param singleton Whether to cache the instance.
   * @returns The resolver itself.
   */
  set<T>(
    identifier: string,
    create: Factory<T>,
    singleton = true
  ): DependencyResolver {
    this.store.set(identifier, {
      singleton,
      create,
    })
    return this
  }

  /**
   * Resolves an instance of the given identifier.
   * @param identifier The identifier of the instance to resolve.
   * @returns The resolved instance.
   * @throws If the identifier is not found.
   */
  get<T>(identifier: string): T {
    const item = this.store.get(identifier)

    if (!item) {
      throw new Error(
        `No factory registered for identifier ${String(identifier)}`
      )
    }

    let instance: T

    if (item.singleton && this.cache.has(identifier)) {
      instance = this.cache.get(identifier) as T
    } else {
      instance = item.create(this) as T
      if (item.singleton) {
        this.cache.set(identifier, instance)
      }
    }

    return instance
  }
}

export function configureResolver() {
  const resolver = new DependencyResolver()
  resolver.set(
    AlgorandAdapter.name,
    () =>
      new AlgorandAdapter({
        algodPort: Configuration.algodPort,
        algodServer: Configuration.algodServer,
        algodToken: Configuration.algodToken,
        fundingMnemonic: Configuration.fundingMnemonic,
      })
  )
  resolver.set(
    DirectusAdapter.name,
    () =>
      new DirectusAdapter({
        accessToken: Configuration.cmsAccessToken,
        url: Configuration.cmsUrl,
      })
  )
  resolver.set(
    SendgridAdapter.name,
    () =>
      new SendgridAdapter({
        sendgridApiKey: Configuration.sendgridApiKey,
        sendgridFromEmail: Configuration.sendgridFromEmail,
      })
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
      new NotificationsService(c.get<SendgridAdapter>(SendgridAdapter.name))
  )
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
        c.get<NotificationsService>(NotificationsService.name)
      )
  )
  resolver.set(
    CollectiblesService.name,
    (c) =>
      new CollectiblesService(
        c.get<DirectusAdapter>(DirectusAdapter.name),
        c.get<AlgorandAdapter>(AlgorandAdapter.name)
      )
  )
  resolver.set(
    CircleAdapter.name,
    () =>
      new CircleAdapter({
        apiKey: Configuration.circleApiKey,
        url: Configuration.circleUrl,
      })
  )
  resolver.set(
    CoinbaseAdapter.name,
    () =>
      new CoinbaseAdapter({
        url: Configuration.coinbaseUrl,
      })
  )
  resolver.set(
    PaymentsService.name,
    (c) =>
      new PaymentsService(
        c.get<CircleAdapter>(CircleAdapter.name),
        c.get<CoinbaseAdapter>(CoinbaseAdapter.name),
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
  return resolver
}
