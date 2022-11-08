import { UserError } from './errors'

const prefix = 'Invariant failed'

/**
 * Asserts that the condition is truthy. Throws an error if it is falsy.
 *
 * Beware of this edge case:
 *
 * ```ts
 * const value: string | undefined = loadSomeValue()
 *
 * invariant(!value, 'this will not remove `undefined` from the possible types')
 * value.toUpperCase() // this will be a TS error, value is still `string | undefined`
 *
 * invariant(value !== undefined, 'this will work')
 * value.toUpperCase() // this is now allowed, value is only `string`
 * ```
 *
 * @param condition some condition that evaluates to true or false
 * @param message an optional message for developers only
 * @param ErrorClass an optional class to use to construct the error
 */
export function invariant<ErrorType extends Error = Error>(
  condition: unknown,
  message?: string,
  error?: new (message: string) => ErrorType
): asserts condition {
  if (condition) return
  const ErrorClass = error ?? Error
  throw new ErrorClass(`${prefix}: ${message ?? ''}`)
}

export function userInvariant(
  condition: unknown,
  message: string,
  statusCode = 400
): asserts condition {
  if (condition) return

  throw new UserError(message, statusCode)
}
