export function isStringArray(value: unknown): value is string[] {
  return (
    Array.isArray(value) &&
    value.length > 0 &&
    value.every((v) => typeof v === 'string')
  )
}

/**
 * Verifies that the given value is an array of non-undefined values.
 * @param value any value allowed
 * @returns
 */
export function isDefinedArray<T>(value: unknown): value is T[] {
  return Array.isArray(value) && value.every((v) => v !== undefined)
}

/**
 * Splits an array into smaller chunks for batch processing etc.
 * @param array Array to be split into chunks
 * @param chunkSize Max size of each chunk
 * @returns The array split into chunks
 */
export function chunkArray<T>(array: T[], chunkSize: number): T[][] {
  const chunks = []
  let index = 0
  while (index < array.length) {
    chunks.push(array.slice(index, index + chunkSize))
    index += chunkSize
  }
  return chunks
}
