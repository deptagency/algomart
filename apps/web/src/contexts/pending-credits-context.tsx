import { CircleTransferStatus } from '@algomart/schemas'
import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react'

import { useAuth } from './auth-context'

import { useInterval } from '@/hooks/use-interval'
import { CheckoutService } from '@/services/checkout-service'

export interface PendingCreditsContextProps {
  findPendingCredits: (doRestartRetries?: boolean) => Promise<void>
  isOutOfRetries: boolean
  someCreditsArePending: boolean
  sumPendingCredits: number
}

export const PendingCreditsContext =
  createContext<PendingCreditsContextProps | null>(null)

export function usePendingCreditsContext() {
  const pendingCreditsContext = useContext(PendingCreditsContext)
  if (!pendingCreditsContext) throw new Error('PendingCreditsProvider missing')
  return pendingCreditsContext
}

export function usePendingCreditsProvider() {
  const { reloadProfile, user } = useAuth()

  const [isInitialized, setIsInitialized] = useState<boolean>(false)

  const [sumPendingCredits, setSumPendingCredits] = useState<number>(null)
  const [numberOfPendingPurchases, setNumberOfPendingPurchases] =
    useState<number>(null)

  const [tryAttempt, setTryAttempt] = useState<number>(0)
  const [isOutOfRetries, setIsOutOfRetries] = useState<boolean>(false)

  const AUTO_RETRIES = 10

  /**
   * Main function. Is called on initialization and on retry.
   *
   * Can optionally restart the retry process, which should be done in the case of a purchase
   * Param is default true, to remove needing to remember to set it
   *
   * @param doRestartRetries boolean with default value of true.
   */
  const findPendingCredits = useCallback(
    async (doRestartRetries = true) => {
      doRestartRetries ? setTryAttempt(1) : setTryAttempt(tryAttempt + 1)

      const searchTransfersResponse =
        await CheckoutService.instance.searchUserAccountTransfers({
          page: 1,
          pageSize: -1,
          status: [CircleTransferStatus.Pending],
        })

      const getPaymentsMissingTransfersResponse =
        await CheckoutService.instance.getPaymentsMissingTransfers()

      if (!searchTransfersResponse || !getPaymentsMissingTransfersResponse) {
        return
      }

      const transfersAndPaymentsInfo = [
        ...searchTransfersResponse.transfers,
        ...getPaymentsMissingTransfersResponse.payments,
      ]
      setNumberOfPendingPurchases(transfersAndPaymentsInfo.length)
      setSumPendingCredits(
        transfersAndPaymentsInfo?.reduce(
          (sum, current) => sum + Number(current.amount),
          0
        )
      )
    },
    [tryAttempt]
  )

  /**
   * Kick off process whenver a user logs in,
   * otherwise reset state if user logs out
   */
  useEffect(() => {
    if (user?.uid) {
      findPendingCredits()
    } else {
      setIsInitialized(false)
      setSumPendingCredits(null)
      setNumberOfPendingPurchases(null)
    }
  }, [user?.uid]) // eslint-disable-line react-hooks/exhaustive-deps

  /**
   * Poll once a second up until 10 seconds for credit changes
   */
  useInterval(
    () => findPendingCredits(false),
    numberOfPendingPurchases > 0 && tryAttempt < AUTO_RETRIES ? 1000 : null
  )

  /**
   * Set out of retries boolean. Used in pending-credits component to show/hide refresh button
   */
  useEffect(() => {
    setIsOutOfRetries(tryAttempt >= AUTO_RETRIES)
  }, [tryAttempt])

  /**
   * Reload profile, updating credits amount, if number of transfers changes
   */
  useEffect(() => {
    if (numberOfPendingPurchases !== null) {
      if (!isInitialized) {
        setIsInitialized(true)
      } else if (numberOfPendingPurchases >= 0) {
        reloadProfile()
      }
    }
  }, [numberOfPendingPurchases]) // eslint-disable-line react-hooks/exhaustive-deps

  const value = useMemo(
    () => ({
      findPendingCredits,
      isOutOfRetries,
      someCreditsArePending: numberOfPendingPurchases > 0,
      sumPendingCredits,
    }),
    [
      findPendingCredits,
      isOutOfRetries,
      numberOfPendingPurchases,
      sumPendingCredits,
    ]
  )

  return value
}

export function PendingCreditsProvider({ children }: { children: ReactNode }) {
  const value = usePendingCreditsProvider()
  return (
    <PendingCreditsContext.Provider value={value}>
      {children}
    </PendingCreditsContext.Provider>
  )
}
