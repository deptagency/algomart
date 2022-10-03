import {
  CheckoutStatus,
  CircleTransferStatus,
  UserAccountTransfer,
} from '@algomart/schemas'
import { FetcherError, poll } from '@algomart/shared/utils'
import { UseMutateFunction } from '@tanstack/react-query'
import { useRouter } from 'next/router'
import useTranslation from 'next-translate/useTranslation'
import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
} from 'react'

import { useAuth } from './auth-context'
import { usePendingCreditsContext } from './pending-credits-context'

import { CheckoutService } from '@/services/checkout-service'
import { hashEvents } from '@/utils/urls'

interface Product {
  id: string
  price: number
}

interface ProductCreditsPaymentProviderProps {
  onPurchase: UseMutateFunction<
    UserAccountTransfer,
    FetcherError,
    string,
    unknown
  >
  product?: Product
}

export interface ProductCreditsPaymentContextProps {
  handleRetry: () => void
  handleSubmitPayment: () => Promise<void>
  loadingText: string
  product?: Product
  purchasedProductId: string | null
  setPurchasedProductId: (id: string | null) => void
  setStatus: (status: CheckoutStatus) => void
  status: CheckoutStatus
  waitForTransferAndCompletePurchase(paymentId: string): void
}

export const ProductCreditsPaymentContext =
  createContext<ProductCreditsPaymentContextProps | null>(null)

export function useProductCreditsPaymentContext() {
  const payment = useContext(ProductCreditsPaymentContext)
  if (!payment) throw new Error('productCreditsPaymentProvider missing')
  return payment
}

export function useProductCreditsPaymentProvider({
  onPurchase,
  product,
}: ProductCreditsPaymentProviderProps) {
  const transferInterval = useRef<number>()
  const { t } = useTranslation()
  const { query, push, route } = useRouter()
  const auth = useAuth()
  const { findPendingCredits } = usePendingCreditsContext()

  const [status, setStatus] = useState<CheckoutStatus>(CheckoutStatus.form)
  const [purchasedProductId, setPurchasedProductId] = useState<string | null>(
    null
  )
  const [loadingText, setLoadingText] = useState('')
  const price = useMemo(() => product?.price || 0, [product?.price])

  const handleTransferPolling = useCallback(
    async (pendingTransfer: UserAccountTransfer) => {
      // Poll for transfer status to confirm avs check is complete
      const completeWhenNotPendingForTransfer = (
        transfer: UserAccountTransfer | null
      ) => !(transfer?.status !== CircleTransferStatus.Pending)

      const transferResponse = await poll<UserAccountTransfer | null>(
        async () =>
          await CheckoutService.instance.getUserAccountTransferById(
            pendingTransfer.id as string
          ),
        completeWhenNotPendingForTransfer,
        1000
      )

      // Throw error if there was a failure code
      if (
        !transferResponse ||
        transferResponse.status === CircleTransferStatus.Failed
      ) {
        throw new Error('Purchase failed')
      }

      setLoadingText(`${t('common:statuses.Transferring NFT_one')}...`)

      return transferResponse
    },
    [t]
  )

  const handleSubmitPayment = useCallback(async () => {
    setStatus(CheckoutStatus.submitting)
    setLoadingText(t('common:statuses.Validating Purchase With Balance'))
    onPurchase(product.id, {
      onSuccess: async (pendingTransfer) => {
        setLoadingText(`${t('common:statuses.Transferring Funds')}...`)
        try {
          const transfer = await handleTransferPolling(pendingTransfer)

          setPurchasedProductId(transfer.entityId)
          setLoadingText('')
          setStatus(CheckoutStatus.success)
          await auth.reloadProfile()
          findPendingCredits()
          push(hashEvents.creditsPaymentSuccess, undefined, { scroll: false })
        } catch {
          setStatus(CheckoutStatus.error)
        } finally {
          setLoadingText('')
        }
      },
      onError: () => {
        setLoadingText('')
        setStatus(CheckoutStatus.error)
      },
    })
  }, [
    t,
    onPurchase,
    product.id,
    handleTransferPolling,
    auth,
    push,
    findPendingCredits,
  ])

  const pollForTransfer = useCallback(
    async (paymentId: string) => {
      const transfer =
        await CheckoutService.instance.getUserAccountTransferByPaymentId(
          paymentId
        )
      if (!transfer) return
      if (transfer.status === CircleTransferStatus.Failed) {
        clearInterval(transferInterval.current)
        alert('TODO: handle transfer failure')
        setLoadingText('')
      } else if (transfer.status === CircleTransferStatus.Complete) {
        await handleSubmitPayment()
        setLoadingText('')
        clearInterval(transferInterval.current)
      }
    },
    [handleSubmitPayment]
  )

  /**
   * Wait for credits to be fully transferred to user before spending them
   * This should probably all be done on the backend.
   */
  const waitForTransferAndCompletePurchase = useCallback(
    (paymentId: string) => {
      setStatus(CheckoutStatus.awaitingCreditTransfer)
      // Deliberately vague since the user doesn't need to know that
      // we're crediting them before spending those credits.
      setLoadingText(t('common:statuses.Processing payment'))
      transferInterval.current = window.setInterval(
        () => pollForTransfer(paymentId),
        1000
      )
    },
    [pollForTransfer, t]
  )

  const handleRetry = useCallback(() => {
    setStatus(CheckoutStatus.form)
    push({
      pathname: route,
      query: { ...query, step: 'details' },
    })
  }, [push, query, route])

  const value = useMemo(
    () => ({
      product,
      handleSubmitPayment,
      loadingText,
      price,
      purchasedProductId,
      setPurchasedProductId,
      setStatus,
      status,
      handleRetry,
      waitForTransferAndCompletePurchase,
    }),
    [
      product,
      handleSubmitPayment,
      loadingText,
      price,
      purchasedProductId,
      setPurchasedProductId,
      setStatus,
      status,
      handleRetry,
      waitForTransferAndCompletePurchase,
    ]
  )

  return value
}

export function ProductCreditsPaymentProvider({
  children,
  product,
  onPurchase,
}: { children: ReactNode } & ProductCreditsPaymentProviderProps) {
  const value = useProductCreditsPaymentProvider({ product, onPurchase })
  return (
    <ProductCreditsPaymentContext.Provider value={value}>
      {children}
    </ProductCreditsPaymentContext.Provider>
  )
}
