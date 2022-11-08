export function getNextStep<T>(currentStep: T, stepOrder: T[]): T | undefined {
  const index = stepOrder.indexOf(currentStep)
  if (index === -1) return undefined
  return stepOrder[index + 1]
}
