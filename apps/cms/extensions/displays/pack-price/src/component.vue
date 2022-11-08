<template>
  <span :key="trigger">{{ formattedValue }}</span>
</template>

<script lang="ts">
import * as Currencies from '@dinero.js/currencies'
import { defineComponent, ref } from 'vue'
import { Currency, dinero, toFormat } from 'dinero.js'

//All values are USDC
const currency = ref(Currencies.USD)
const language = ref('en-US')

function format(value: number, currency: Currency<number>, locale: string) {
  const price = dinero({ amount: value, currency })
  return toFormat(price, ({ amount, currency }) =>
    amount.toLocaleString(locale, {
      style: 'currency',
      currency: currency.code,
    })
  )
}

function parse(value: number | string | null) {
  if (!value) return 0
  if (typeof value === 'number') return value
  const parsedValue = Number.parseInt(value, 10)
  return Number.isNaN(parsedValue) ? 0 : parsedValue
}

export default defineComponent({
  props: {
    value: {
      type: String,
      default: null,
    },
  },

  data(props) {
    return {
      formattedValue: format(
        parse(props.value),
        currency.value,
        language.value
      ),
    }
  },
  updated() {
    this.formattedValue = format(
      parse(this.$props.value),
      currency.value,
      language.value
    )
  },
})
</script>
