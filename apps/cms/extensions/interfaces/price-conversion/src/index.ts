import { defineInterface } from '@directus/extensions-sdk'

import PriceComponent from './price.vue'

export default defineInterface({
  id: 'price',
  name: 'Price',
  description:
    'Price in USDC. For auctions, this is the initial asking price (reserve price).',
  icon: 'attach_money',
  component: PriceComponent,
  types: ['integer'],
  group: 'standard',
  recommendedDisplays: ['price'],
  options: null,
})
