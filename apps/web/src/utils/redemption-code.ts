import {
  REDEMPTION_CODE_CHARACTERS,
  REDEMPTION_CODE_LENGTH,
} from '@algomart/schemas'

import { randomInteger } from './random'

const randomCharacter = () =>
  REDEMPTION_CODE_CHARACTERS[
    randomInteger(0, REDEMPTION_CODE_CHARACTERS.length)
  ]

export function randomRedemptionCode(length = REDEMPTION_CODE_LENGTH) {
  return Array.from({ length }, randomCharacter).join('')
}
