import { PublishedPack } from '@algomart/schemas'

import EmailVerfication from '@/components/profile/email-verification'
import PurchaseNFTForm from '@/components/purchase-nft-form/purchase-nft-form'
import { useAuth } from '@/contexts/auth-context'

export interface CheckoutTemplateProps {
  currentBid: number | null
  packId: string | null
  release: PublishedPack
}

export default function CheckoutTemplate({
  currentBid,
  packId,
  release,
}: CheckoutTemplateProps) {
  const { user } = useAuth()
  if (!user?.emailVerified) {
    return <EmailVerfication inline />
  }
  return (
    <PurchaseNFTForm
      currentBid={currentBid}
      packId={packId}
      release={release}
    />
  )
}
