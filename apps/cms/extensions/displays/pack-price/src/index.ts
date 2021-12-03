import { defineDisplay } from '@directus/extensions-sdk'

import PriceComponent from './component.vue'

export default defineDisplay({
  id: 'price',
  name: 'Price',
  description: 'Change price from integer to float when displayed around app.',
  icon: 'attach_money',
  component: PriceComponent,
  types: ['integer'],
  options: null,
})
