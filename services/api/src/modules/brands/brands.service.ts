import { DEFAULT_LOCALE } from '@algomart/schemas'

import DirectusAdapter, {
  DirectusStatus,
  ItemFilter,
} from '@/lib/directus-adapter'

export default class BrandsService {
  constructor(private readonly cms: DirectusAdapter) {}

  async getBrands(locale = DEFAULT_LOCALE) {
    const filter: ItemFilter = {
      status: {
        _eq: DirectusStatus.Published,
      },
    }
    return await this.cms.findAllBrands({ filter, locale })
  }

  async getBrand(slug: string, locale = DEFAULT_LOCALE) {
    return await this.cms.findBrand({ slug, locale })
  }
}
