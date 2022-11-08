export interface Factory<T> {
  (resolver: DependencyResolver): T
}

export interface FactoryMethod<T> {
  create: Factory<T>
}

export interface ResolverItem<T> {
  singleton: boolean
  create: Factory<T>
}

/**
 * This is a _very_ basic dependency resolver. By default it will cache the
 * resolved instance, virtually turning them into singletons.
 */
export class DependencyResolver {
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

  /**
   * Removes all cached instances and configured factories. Mostly used for testing.
   */
  clear() {
    this.cache.clear()
    this.store.clear()
  }
}
