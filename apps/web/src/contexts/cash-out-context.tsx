import {
  AlgorandAccountAddressPattern,
  CircleTransferStatus,
  MIN_PAYOUT_AMOUNT_CENTS,
  UserAccountTransfer,
} from '@algomart/schemas'
import { useRouter } from 'next/router'
import { Translate } from 'next-translate'
import useTranslation from 'next-translate/useTranslation'
import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useMemo,
  useState,
} from 'react'
import {
  ExtractError,
  matches,
  max,
  min,
  number,
  object,
  required,
  string,
} from 'validator-fns'

import { usePendingCreditsContext } from './pending-credits-context'

import { useAuth } from '@/contexts/auth-context'
import { CheckoutService } from '@/services/checkout-service'
import { PayoutService } from '@/services/payout-service'
import { poll } from '@/utils/poll'
import { urls } from '@/utils/urls'

interface CashOutProviderProps {
  availableBalance: number
  isVerificationEnabled: boolean
  userHasCompletedKyc: boolean
}

export interface CashOutContextProps {
  amountToWithdraw: number | null
  creditBalance: number
  availableBalance: number
  isVerificationEnabled: boolean
  userHasCompletedKyc: boolean
  loadingText: string
  walletAddress: string
  error: string
  handleCashOut(data: CreateCashOutRequest): void
  setWalletAddress(walletAddress: string): void
  setLoadingText: (loadingText: string) => void
  updateAmountToWithdraw(amount: number): void
}

const amount = (t: Translate, availableBalance: number) => {
  return number(
    required(t('forms:errors.required')),
    min(MIN_PAYOUT_AMOUNT_CENTS / 100, t('forms:errors.amountToWithdraw')),
    max(availableBalance, t('forms:errors.amountToWithdraw'))
  )
}

const walletFormat = (t: Translate) =>
  string(
    required(t('forms:errors.walletAddress')),
    matches(AlgorandAccountAddressPattern, t('forms:errors.walletAddress'))
  )

export const validateCashOut = (t: Translate, availableBalance: number) =>
  object({
    amount: amount(t, availableBalance),
    wallet: walletFormat(t),
  })

export const validateCashOutRequest = (t: Translate) =>
  object({
    amount: number(
      required(t('forms:errors.required')),
      min(MIN_PAYOUT_AMOUNT_CENTS / 100, t('forms:errors.amountToWithdraw'))
    ),
    destinationAddress: walletFormat(t),
  })

export type FormValidation = ExtractError<
  ReturnType<typeof validateCashOut>
> & { form?: string }

export type CreateCashOutRequest = {
  amount?: number
  wallet?: string
}

export const CashOutContext = createContext<CashOutContextProps | null>(null)

export function useCashOutContext() {
  const cashOut = useContext(CashOutContext)
  if (!cashOut) throw new Error('CashOutProvider missing')
  return cashOut
}

export function useCashOutProvider({
  availableBalance,
  isVerificationEnabled,
  userHasCompletedKyc,
}: CashOutProviderProps) {
  const { t } = useTranslation()
  const auth = useAuth()
  const { findPendingCredits } = usePendingCreditsContext()
  const { push } = useRouter()

  const creditBalance = auth?.user?.balance ?? 0

  const [loadingText, setLoadingText] = useState('')
  const [amountToWithdraw, setAmountToWithdraw] = useState(null)
  const [walletAddress, setWalletAddress] = useState('')
  const [error, setError] = useState('')

  const updateAmountToWithdraw = useCallback(
    async (amount?: number) => {
      if (amount < availableBalance) {
        setAmountToWithdraw(amount)
      } else {
        setAmountToWithdraw(availableBalance)
      }
    },
    [availableBalance]
  )

  const handleCashOut = useCallback(
    async (body: CreateCashOutRequest) => {
      if (isVerificationEnabled && !userHasCompletedKyc) return

      setError('')
      setLoadingText(`${t('common:statuses.Submitting Withdrawal')}...`)

      try {
        const transfer = await PayoutService.instance.initiateUsdcPayout({
          amount: String(amountToWithdraw),
          destinationAddress: body.wallet,
        })

        // Throw error if failed request
        if (!transfer?.id) {
          // This is most commonly because they have a different transfer pending
          throw new Error(t('common:statuses.Payout not started'))
        }

        setLoadingText(`${t('common:statuses.Transferring Funds')}...`)
        findPendingCredits()
        const completeWhenNotPendingForTransfer = (
          transfer: UserAccountTransfer | null
        ) => !(transfer?.status !== CircleTransferStatus.Pending)
        const transferResponse = await poll<UserAccountTransfer | null>(
          async () =>
            await CheckoutService.instance.getUserAccountTransferById(
              transfer.id as string
            ),
          completeWhenNotPendingForTransfer,
          1000
        )

        if (
          !transferResponse ||
          transferResponse.status === CircleTransferStatus.Failed
        ) {
          // Something went wrong on Circle's side, or account opted out before completion
          throw new Error(t('common:statuses.Payout failed to complete'))
        }

        await auth.reloadProfile()
        // Polling can take longer than 10 seconds, check before redirect
        await findPendingCredits(false)
        push(urls.myWallet)
      } catch (error) {
        setLoadingText('')
        setError(
          error?.message || t('common:statuses.Payout failed to complete')
        )
      }
    },
    [
      isVerificationEnabled,
      userHasCompletedKyc,
      t,
      amountToWithdraw,
      findPendingCredits,
      auth,
      push,
    ]
  )

  const value = useMemo(
    () => ({
      amountToWithdraw,
      creditBalance,
      availableBalance,
      loadingText,
      isVerificationEnabled,
      userHasCompletedKyc,
      walletAddress,
      error,
      handleCashOut,
      setWalletAddress,
      setLoadingText,
      updateAmountToWithdraw,
    }),
    [
      amountToWithdraw,
      creditBalance,
      availableBalance,
      loadingText,
      isVerificationEnabled,
      userHasCompletedKyc,
      walletAddress,
      error,
      handleCashOut,
      setWalletAddress,
      setLoadingText,
      updateAmountToWithdraw,
    ]
  )

  return value
}

export function CashOutProvider({
  availableBalance,
  isVerificationEnabled,
  userHasCompletedKyc,
  children,
}: {
  availableBalance: number
  isVerificationEnabled: boolean
  userHasCompletedKyc: boolean
  children: ReactNode
}) {
  const value = useCashOutProvider({
    availableBalance,
    isVerificationEnabled,
    userHasCompletedKyc,
  })
  return (
    <CashOutContext.Provider value={value}>{children}</CashOutContext.Provider>
  )
}
