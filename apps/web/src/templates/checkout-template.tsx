import BankAccountPurchaseForm from '@/components/bank-account-form/bank-account-form'
import EmailVerification from '@/components/profile/email-verification'
import PurchaseNFTForm from '@/components/purchase-form/purchase-form'
import { useAuth } from '@/contexts/auth-context'
import { PaymentContextProps } from '@/contexts/payment-context'
import { Environment } from '@/environment'
import { isGreaterThanOrEqual } from '@/utils/format-currency'
import { MAX_BID_FOR_CARD_PAYMENT } from '@/utils/purchase-validation'

export default function CheckoutTemplate(paymentProps: PaymentContextProps) {
  const { user } = useAuth()
  if (!user?.emailVerified) {
    return <EmailVerification inline />
  }
  const doesRequireWirePayment =
    Environment.isWireEnabled &&
    ((paymentProps.currentBid &&
      isGreaterThanOrEqual(
        paymentProps.currentBid,
        MAX_BID_FOR_CARD_PAYMENT
      )) ||
      (paymentProps.release.price &&
        isGreaterThanOrEqual(
          paymentProps.release.price,
          MAX_BID_FOR_CARD_PAYMENT
        )))
  return (
    <>
      {doesRequireWirePayment ? (
        <BankAccountPurchaseForm {...paymentProps} />
      ) : (
        <PurchaseNFTForm {...paymentProps} />
      )}
    </>
  )
}
