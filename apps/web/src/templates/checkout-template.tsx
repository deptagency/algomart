import EmailVerification from '@/components/profile/email-verification'
import PurchaseNFTForm from '@/components/purchase-form/purchase-form'
import { useAuth } from '@/contexts/auth-context'
import { PaymentContextProps } from '@/contexts/payment-context'

export default function CheckoutTemplate(paymentProps: PaymentContextProps) {
  const { user } = useAuth()
  if (!user?.emailVerified) {
    return <EmailVerification inline />
  }
  return <PurchaseNFTForm {...paymentProps} />
}
