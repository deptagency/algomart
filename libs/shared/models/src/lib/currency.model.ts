import { CurrencyConversionSchema } from '@algomart/schemas'

import { BaseModel } from './base.model'

export class CurrencyConversionModel extends BaseModel {
  static tableName = 'CurrencyConversions'
  static jsonSchema = CurrencyConversionSchema

  sourceCurrency!: string
  targetCurrency!: string
  exchangeRate!: number
}
