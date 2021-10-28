import { PackWithId } from '@algomart/schemas'
import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react'

export type PackAndRedeemCode = { pack: PackWithId; redeemCode: string }

interface Redemption {
  redeemable: PackAndRedeemCode | null
  setRedeemable(data: PackAndRedeemCode | null): void
}

export const RedemptionContext = createContext<Redemption | null>(null)

export function useRedemption() {
  const redemption = useContext(RedemptionContext)
  if (!redemption) throw new Error('RedemptionProvider missing')
  return redemption
}

export function useRedemptionProvider() {
  const [redeem, setRedeem] = useState<PackAndRedeemCode | null>(null)

  const setRedeemable = useCallback((body) => {
    setRedeem(body)
    window.localStorage.setItem('redemptionData', JSON.stringify(body))
  }, [])

  useEffect(() => {
    const redemptionData =
      window && window.localStorage.getItem('redemptionData')
    if (redemptionData) {
      try {
        const parsedData: PackAndRedeemCode = JSON.parse(redemptionData)
        setRedeemable(parsedData)
      } catch {
        // Malformed JSON, do nothing
      }
    }
  }, [setRedeemable])

  const value = useMemo(
    () => ({ redeemable: redeem, setRedeemable }),
    [redeem, setRedeemable]
  )
  return value
}

export function RedemptionProvider({ children }: { children: ReactNode }) {
  const value = useRedemptionProvider()
  return (
    <RedemptionContext.Provider value={value}>
      {children}
    </RedemptionContext.Provider>
  )
}
