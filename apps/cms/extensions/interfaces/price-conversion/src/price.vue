<template>
  <v-input
    v-model="formattedValue"
    :key="trigger"
    @focus="onFocus"
    @blur="onBlur"
  />
</template>

<script lang="ts">
import * as Currencies from '@dinero.js/currencies'
import { Currency, dinero, toFormat } from 'dinero.js'
import { defineComponent, ref } from 'vue'

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

function toFloat(value: number, currency: Currency<number>) {
  return value / currency.base ** currency.exponent
}

function toInteger(value: number, currency: Currency<number>) {
  return Math.round(value * currency.base ** currency.exponent)
}

function prepareValue(value: string, locale: string) {
  const localized = (0.1).toLocaleString(locale)
  const decimal = localized[1]
  const pattern = new RegExp(`[^\\d${decimal}]`, 'g')
  return value.replace(pattern, '').replace(decimal, '.')
}

export default defineComponent({
  props: {
    value: {
      type: String,
      default: null,
    },
  },

  emits: ['input'],

  data(props) {
    return {
      editing: false,
      rawValue: parse(props.value),
      formattedValue: format(
        parse(props.value),
        currency.value,
        language.value
      ),
    }
  },
  updated() {
    if (this.editing) return
    this.rawValue = parse(this.$props.value)
    this.formattedValue = format(this.rawValue, currency.value, language.value)
  },

  methods: {
    onFocus(event: FocusEvent) {
      const input = event.target as HTMLInputElement

      this.editing = true

      // set formatted value to localized decimal point without thousand separators
      this.formattedValue = toFloat(
        this.rawValue,
        currency.value
      ).toLocaleString(language.value, { useGrouping: false })

      // need to delay select() for a moment while value is being updated
      setTimeout(() => input.select(), 0)
    },

    onBlur() {
      // prepare localize value for JS-style decimal point
      const prepared = prepareValue(this.formattedValue, language.value)

      let newValue = toInteger(Number.parseFloat(prepared), currency.value)
      if (Number.isNaN(newValue)) newValue = 0

      this.rawValue = newValue
      this.formattedValue = format(newValue, currency.value, language.value)
      this.$emit('input', newValue)
      this.editing = false
    },
  },
})
</script>
