// Via https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Math/random#getting_a_random_integer_between_two_values
export function randomInteger(min: number, max: number) {
  const minCeil = Math.ceil(min)
  const maxFloor = Math.floor(max)
  return Math.floor(Math.random() * (maxFloor - minCeil) + minCeil)
}

// Shuffles an array in-place
export function shuffleArray<T>(array: T[]): T[] {
  for (let index = array.length - 1; index > 0; index--) {
    const newIndex = randomInteger(0, index)
    ;[array[index], array[newIndex]] = [array[newIndex], array[index]]
  }
  return array
}
