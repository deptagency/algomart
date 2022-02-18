import {
  REDEMPTION_CODE_CHARACTERS,
  REDEMPTION_CODE_LENGTH,
} from '@algomart/schemas'

export function randomInteger(min: number, max: number) {
  const minCeil = Math.ceil(min)
  const maxFloor = Math.floor(max)
  return Math.floor(Math.random() * (maxFloor - minCeil) + minCeil)
}

export function shuffleArray<T>(array: T[]): T[] {
  for (let index = array.length - 1; index > 0; index--) {
    const index_ = randomInteger(0, index)
    ;[array[index], array[index_]] = [array[index_], array[index]]
  }

  return array
}

const randomCharacter = () =>
  REDEMPTION_CODE_CHARACTERS[
    randomInteger(0, REDEMPTION_CODE_CHARACTERS.length)
  ]

export function randomRedemptionCode(length = REDEMPTION_CODE_LENGTH) {
  return Array.from({ length }, randomCharacter).join('')
}
