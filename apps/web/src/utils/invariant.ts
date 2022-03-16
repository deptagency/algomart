export function invariant(
  condition: unknown,
  message: string
): asserts condition {
  if (condition) return
  throw new Error(`Invariant failed: ${message}`)
}
