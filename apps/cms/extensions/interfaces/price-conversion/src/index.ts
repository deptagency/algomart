import { defineInterface } from '@directus/extensions-sdk'

import PriceComponent from './price.vue'

export default defineInterface({
  id: 'price',
  name: 'Price',
  description:
    "Price in application's currency. For auctions, this is the initial asking price (reserve price).",
  icon: 'attach_money',
  component: PriceComponent,
  types: ['integer'],
  groups: ['standard'],
  recommendedDisplays: ['price'],
  options: null,
})
