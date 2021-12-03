import { PublishedPack } from '@algomart/schemas'

import EmailVerification from '@/components/profile/email-verification'
import PurchaseNFTForm from '@/components/purchase-form/purchase-form'
import { useAuth } from '@/contexts/auth-context'

export interface CheckoutTemplateProps {
  auctionPackId: string | null
  currentBid: number | null
  release: PublishedPack
}

export default function CheckoutTemplate({
  auctionPackId,
  currentBid,
  release,
}: CheckoutTemplateProps) {
  const { user } = useAuth()
  if (!user?.emailVerified) {
    return <EmailVerification inline />
  }
  return (
    <>
      <PurchaseNFTForm
        auctionPackId={auctionPackId}
        currentBid={currentBid}
        release={release}
      />
    </>
  )
}
