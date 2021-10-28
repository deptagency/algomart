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
