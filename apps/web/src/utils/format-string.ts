export const formatAlgoAddress = (algoAddress: string) => {
  const first6 = algoAddress.slice(0, 6)
  const last6 = algoAddress.slice(-6, algoAddress.length)
  return `${first6}...${last6}`
}
