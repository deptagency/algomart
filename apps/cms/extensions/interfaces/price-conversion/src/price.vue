<template>
  <v-input
    v-model="options"
    @input="handleChange($event.target.value)"
    @focus="onFocus"
  />
</template>

<script lang="ts">
import * as Currencies from '@dinero.js/currencies'
import { Currency, dinero, toFormat } from 'dinero.js'
import { useApi } from '@directus/extensions-sdk'
import { defineComponent, computed, ref } from 'vue'

const currency = ref(Currencies.USD)

function formatFloatToInt(float: number | string, currency: Currency<number>) {
  const number = typeof float === 'string' ? Number.parseFloat(float) : float
  const factor = currency.base ** currency.exponent
  const amount = Math.round(number * factor)
  const price = dinero({ amount, currency })
  return price.toJSON().amount
}

function formatIntToFloat(amount: number, currency: Currency<number>) {
  const price = dinero({ amount, currency })
  const float = toFormat(price, ({ amount, currency }) =>
    amount.toFixed(currency.exponent)
  )
  return float
}

// Price conversion from integer to float
function readPrice(price: number, currency: Currency<number>) {
  try {
    const decimal = formatIntToFloat(price, currency)
    return decimal
  } catch (error) {
    throw new Error(error)
  }
}

// Price conversion from float to integer
function updatePrice(price: number | string, currency: Currency<number>) {
  try {
    if (!price) return price
    const integer = formatFloatToInt(price, currency)
    return integer
  } catch (error) {
    throw new Error(error)
  }
}

export default defineComponent({
  props: {
    value: {
      type: String,
      default: null,
    },
  },
  emits: ['input'],
  setup(props) {
    const isInputActive = ref(false)
    const typedValue = ref(props.value)
    // Retrieve application currency
    const api = useApi()
    api.get('/items/application').then((app) => {
      if (app.data.data.currency) {
        currency.value = Currencies[app.data.data.currency]
      }
    })
    const options = computed({
      get() {
        let value = props.value || null
        if (
          //!isInputActive.value &&
          props.value &&
          typeof props.value === 'number'
        ) {
          value = readPrice(props.value, currency.value)
        } else if (isInputActive.value && value) {
          // The value will be change to an integer on change, so we need to
          // change the value back to the typed value which hadn't changed, to
          // solve the issue where it formats as the user is typing.
          value = typedValue.value
        }
        typedValue.value = value
        return value
      },
      set() {},
    })
    function onFocus() {
      isInputActive.value = true
    }
    return { options, onFocus }
  },
  methods: {
    handleChange(value: string) {
      const newValue = updatePrice(value, currency.value)
      this.$emit('input', newValue)
    },
  },
})
</script>
