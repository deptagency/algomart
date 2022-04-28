import * as Currencies from '@dinero.js/currencies'

import {
  DEFAULT_LANG,
  SortDirection,
  PublishedPack,
  PackType,
  ProductQuery,
  ProductSortField,
  ProductType,
} from '@algomart/schemas'
import {
  CMSCacheAdapter,
  ItemSort,
  ItemFilters,
} from '@algomart/shared/adapters'
import { PackModel } from '@algomart/shared/models'
import { invariant } from '@algomart/shared/utils'
import { Transaction } from 'objection'
import pino from 'pino'
import { I18nService } from '.'

export class ProductsService {
  logger: pino.Logger<unknown>

  constructor(
    private readonly cms: CMSCacheAdapter,
    private readonly i18nService: I18nService,
    private currency: Currencies.Currency<number>,
    logger: pino.Logger<unknown>
  ) {
    this.logger = logger.child({ context: this.constructor.name })
  }

  async searchProducts(
    {
      currency = this.currency.code,
      language = DEFAULT_LANG,
      page = 1,
      pageSize = 10,
      type = [],
      priceHigh,
      priceLow,
      status,
      reserveMet,
      sortBy = ProductSortField.ReleasedAt,
      sortDirection = SortDirection.Descending,
    }: ProductQuery,
    trx?: Transaction
  ): Promise<{ packs: PublishedPack[]; total: number }> {
    invariant(page > 0, 'page must be greater than 0')

    const sort: ItemSort[] = [
      {
        field: sortBy,
        order: sortDirection,
      },
    ]

    const filter: ItemFilters = {
      type: {
        _in: type,
      },
    }

    if (priceHigh || priceLow) {
      if (currency !== this.currency.code) {
        const { exchangeRate } = await this.i18nService.getCurrencyConversion(
          {
            sourceCurrency: currency,
            targetCurrency: this.currency.code,
          },
          trx
        )

        if (priceHigh) priceHigh *= exchangeRate
        if (priceLow) priceLow *= exchangeRate
      }

      filter.price = {}
      if (priceHigh) filter.price._lte = Math.round(priceHigh)
      if (priceLow) filter.price._gte = Math.round(priceLow)
    }

    if (priceHigh || priceLow) {
      filter.price = {}
      if (priceHigh) filter.price._lte = Math.round(priceHigh)
      if (priceLow) filter.price._gte = Math.round(priceLow)
    }

    if (status) {
      filter.status = {
        _in: status,
      }
    }

    if (reserveMet) {
      filter.reserveMet = {
        _gt: 0,
      }
    }

    const { packs: templates, total } = await this.cms.findAllPacks({
      filter,
      sort,
      language,
      page,
      pageSize,
    })

    const packCounts = await this.getPackCounts(
      templates.map((t) => t.templateId)
    )

    let packsWithActiveBids: PackModel[] = []

    if (type.length === 0 || type.includes(ProductType.Auction)) {
      // only load bids when searching for auction packs
      packsWithActiveBids = await this.getPacksWithActiveBids(
        templates
          .filter((t) => t.type === PackType.Auction)
          .map((t) => t.templateId)
      )
    }

    const packLookup = new Map(packCounts.map((p) => [p.templateId, p]))
    const packWithActiveBidsLookup = new Map(
      packsWithActiveBids.map((p) => [p.templateId, p])
    )

    const assemblePack = this.createPublishedPackFn(
      packLookup,
      packWithActiveBidsLookup
    )

    const allPublicPacks = templates.map((pack) => assemblePack(pack))

    return {
      packs: allPublicPacks,
      total,
    }
  }
}
