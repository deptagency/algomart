import * as Currencies from '@dinero.js/currencies'

import {
  DEFAULT_LANG,
  ListType,
  SortDirection,
  ProductQuery,
  ProductSortField,
  Product,
  ProductType,
} from '@algomart/schemas'
import {
  CMSCacheAdapter,
  ItemSort,
  ItemFilters,
} from '@algomart/shared/adapters'
import { invariant } from '@algomart/shared/utils'
import { Transaction } from 'objection'
import pino from 'pino'
import { I18nService, PacksService } from '.'
import { PackModel } from '@algomart/shared/models'

export class ProductsService {
  logger: pino.Logger<unknown>

  constructor(
    private readonly cms: CMSCacheAdapter,
    private readonly i18nService: I18nService,
    private readonly packsService: PacksService,
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
      listTypes = [],
      productTypes = [],
      priceHigh,
      priceLow,
      status,
      reserveMet,
      sortBy = ProductSortField.ReleasedAt,
      sortDirection = SortDirection.Descending,
    }: ProductQuery,
    trx?: Transaction
  ): Promise<{ products: Product[]; total: number }> {
    invariant(page > 0, 'page must be greater than 0')

    const sort: ItemSort[] = [
      {
        field: sortBy,
        order: sortDirection,
      },
    ]

    const filter: ItemFilters = {
      productType: {
        _in: productTypes,
      },
      listType: {
        _in: listTypes
      }
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

    const { data: templates, meta: { filter_count: total } } = await this.cms.findAllProducts({
      filter,
      sort,
      // language,
      page,
      limit: pageSize,
    })

    console.log('products:')
    console.log(templates)

    // Extra pack logic
    this.compilePackData(templates, listTypes)

    // Extra collectible logic
    this.compileCollectibleData(templates)

    return {
      products: templates,
      total,
    }
  }

  private async compilePackData(templates: Product[], listTypes: ListType[]) {
    // Extra pack logic
    const packTemplates = templates.filter((t) => t.productType === ProductType.Pack)
    const packCounts = await this.packsService.getPackCounts(
      packTemplates.map((t) => t.templateId)
    )

    let packsWithActiveBids: PackModel[] = []

    if (listTypes.length === 0 || listTypes.includes(ListType.Auction)) {
      // only load bids when searching for auction packs
      packsWithActiveBids = await this.packsService.getPacksWithActiveBids(
        packTemplates
          .filter((t) => t.listType === ListType.Auction)
          .map((t) => t.templateId)
      )
    }

    const packLookup = new Map(packCounts.map((p) => [p.templateId, p]))
    const packWithActiveBidsLookup = new Map(
      packsWithActiveBids.map((p) => [p.templateId, p])
    )

    const assemblePack = this.packsService.createPublishedPackFn(
      packLookup,
      packWithActiveBidsLookup
    )

    // const allPublicPacks = packTemplates.map((pack) => assemblePack(pack))
  }

  private async compileCollectibleData(templates: Product[]) {

  }
}
