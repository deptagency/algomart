import { DEFAULT_CURRENCY, MIN_PAYOUT_AMOUNT_CENTS } from '@algomart/schemas'
import { CheckIcon } from '@heroicons/react/outline'
import clsx from 'clsx'
import useTranslation from 'next-translate/useTranslation'
import { useEffect, useMemo, useState } from 'react'

import css from './cash-out-form.module.css'

import AlertMessage from '@/components/alert-message/alert-message'
import Async from '@/components/async/async'
import Button from '@/components/button'
import CashOutSummary from '@/components/cash-out/cash-out-summary'
import Currency from '@/components/currency/currency'
import CurrencyInput from '@/components/currency-input/currency-input'
import { Form } from '@/components/form'
import InputField from '@/components/input-field'
import KYCNotice from '@/components/kyc/notice'
import MainPanelHeader from '@/components/main-panel-header'
import EmailVerificationPrompt from '@/components/profile/email-verification-prompt'
import { AppConfig } from '@/config'
import { useAuth } from '@/contexts/auth-context'
import { useCashOutContext, validateCashOut } from '@/contexts/cash-out-context'
import { useCurrency } from '@/contexts/currency-context'
import { AlgorandAdapter } from '@/libs/algorand-adapter'
import { formatCredits } from '@/utils/currency'
import { urls } from '@/utils/urls'

const algorand = new AlgorandAdapter(AppConfig.chainType)

function NonDefaultCurrency({ value }) {
  const { currency } = useCurrency()
  return currency !== DEFAULT_CURRENCY && <Currency value={value} />
}

function WithdrawMax({
  updateAmountToWithdraw,
  availableBalance,
}: {
  availableBalance: number
  updateAmountToWithdraw: (amount: number) => void
}) {
  const { t } = useTranslation()

  return (
    <button
      className={css.withdrawMax}
      onClick={(event) => {
        event.preventDefault()
        updateAmountToWithdraw(availableBalance)
      }}
    >
      {t('forms:cashOut.withdrawMax')}
    </button>
  )
}

export default function CashOutForm() {
  const { t } = useTranslation()
  const { user } = useAuth()
  const {
    amountToWithdraw,
    availableBalance,
    creditBalance,
    loadingText,
    isVerificationEnabled,
    userHasCompletedKyc,
    walletAddress,
    error,
    handleCashOut,
    setWalletAddress,
    updateAmountToWithdraw,
  } = useCashOutContext()
  // NOTE: This is null until we know whether they've opted in to USDC or not.
  const [walletError, setWalletError] = useState('')
  const [isOptedIn, setIsOptedIn] = useState<boolean>(null)
  const hasEnoughToCashOut = availableBalance >= MIN_PAYOUT_AMOUNT_CENTS
  const needsKyc = isVerificationEnabled && !userHasCompletedKyc
  const shouldFormBeDisabled = needsKyc || !hasEnoughToCashOut
  const validate = useMemo(
    () => validateCashOut(t, availableBalance),
    [t, availableBalance]
  )

  useEffect(() => {
    setIsOptedIn(null)
    setWalletError('')
    if (walletAddress.length === 58) {
      algorand
        .hasOptedInToUSDC(walletAddress)
        .then((hasOptedIn) => {
          setIsOptedIn(hasOptedIn)
        })
        .catch((error) => {
          if (error.status === 404) {
            setWalletError(t('forms:cashOut.walletNotFound'))
          } else if (error.status === 400) {
            setWalletError(t('forms:cashOut.invalidWalletAddress'))
          } else {
            setWalletError(error?.response?.body?.message || error)
          }
        })
    }
  }, [t, walletAddress])

  if (!user?.emailVerified) {
    return <EmailVerificationPrompt inline />
  }

  return (
    <Async isLoading={!!loadingText} loadingText={loadingText}>
      <MainPanelHeader
        title={t('forms:cashOut.Cash Out')}
        backLink={urls.myWallet}
      />
      {needsKyc && (
        <AlertMessage
          variant="red"
          content={<KYCNotice isCashOut />}
          className={css.alert}
        />
      )}
      <Form
        className={clsx(css.form, { [css.dimmed]: needsKyc })}
        onSubmit={handleCashOut}
        validate={validate}
      >
        {({ errors }) => (
          <>
            <InputField
              label={t('forms:cashOut.Your balance')}
              readOnly
              endAdornment={<NonDefaultCurrency value={creditBalance} />}
              value={`${formatCredits(creditBalance)}`}
            />
            <InputField
              label={t('forms:cashOut.Available to cash out today')}
              readOnly
              endAdornment={<NonDefaultCurrency value={availableBalance} />}
              value={`${formatCredits(availableBalance)}`}
            />
            <CurrencyInput
              error={errors.amount}
              name="amount"
              credits
              label={t('forms:cashOut.Amount to withdraw')}
              helpText={
                hasEnoughToCashOut ? (
                  <WithdrawMax
                    availableBalance={availableBalance}
                    updateAmountToWithdraw={updateAmountToWithdraw}
                  />
                ) : null
              }
              onChange={updateAmountToWithdraw}
              disabled={shouldFormBeDisabled}
              max={availableBalance}
              endAdornment={<NonDefaultCurrency value={amountToWithdraw} />}
              value={amountToWithdraw}
            />
            <InputField
              error={walletError || errors.wallet}
              name="wallet"
              helpText={isOptedIn && <CheckIcon className={css.checkIcon} />}
              label={t('forms:cashOut.USDC-A wallet address')}
              onChange={setWalletAddress}
              disabled={shouldFormBeDisabled}
              value={walletAddress}
            />
            {isOptedIn === false && (
              <AlertMessage
                variant="red"
                content={t('forms:cashOut.optInError')}
                className={css.optInError}
              />
            )}

            <CashOutSummary />

            <Button
              className="mt-8"
              fullWidth
              size="large"
              type="submit"
              disabled={!isOptedIn || shouldFormBeDisabled || !!loadingText}
            >
              {t('forms:cashOut.Cash Out')}
            </Button>
          </>
        )}
      </Form>

      {error && <AlertMessage variant="red" content={error} className="mt-8" />}
    </Async>
  )
}
