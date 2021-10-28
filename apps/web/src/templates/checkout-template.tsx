import { PublishedPack } from '@algomart/schemas'
import { ExtractError } from 'validator-fns'

import EmailVerfication from '@/components/profile/email-verification'
import PurchaseNFTForm from '@/components/purchase-nft-form/purchase-nft-form'
import { useAuth } from '@/contexts/auth-context'
import { CheckoutStatus } from '@/pages/checkout'
import {
  validateBidsForm,
  validateExpirationDate,
  validatePurchaseForm,
} from '@/utils/purchase-validation'

export interface CheckoutTemplateProps {
  handleSubmitBid(data: FormData): Promise<void>
  handleSubmitPassphrase(passphrase: string): Promise<boolean>
  handleSubmitPurchase(data: FormData): Promise<void>
  formErrors?: ExtractError<
    ReturnType<
      | typeof validateBidsForm
      | typeof validatePurchaseForm
      | typeof validateExpirationDate
    >
  >
  loadingText: string
  currentBid: number | null
  packId: string | null
  release: PublishedPack
  setStatus: (status: CheckoutStatus) => void
  status: CheckoutStatus
}

export default function CheckoutTemplate({
  currentBid,
  handleSubmitBid,
  handleSubmitPassphrase,
  handleSubmitPurchase,
  formErrors,
  loadingText,
  packId,
  release,
  setStatus,
  status,
}: CheckoutTemplateProps) {
  const { user } = useAuth()
  if (!user?.emailVerified) {
    return <EmailVerfication inline />
  }
  return (
    <PurchaseNFTForm
      formErrors={formErrors}
      loadingText={loadingText}
      onSubmitBid={handleSubmitBid}
      onSubmitPassphrase={handleSubmitPassphrase}
      onSubmitPurchase={handleSubmitPurchase}
      currentBid={currentBid}
      packId={packId}
      release={release}
      setStatus={setStatus}
      status={status}
    />
  )
}
