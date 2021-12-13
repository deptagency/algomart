import { PublishedPack } from '@algomart/schemas'

import BankAccountPurchaseForm from '@/components/bank-account-form/bank-account-form'
import EmailVerification from '@/components/profile/email-verification'
import PurchaseNFTForm from '@/components/purchase-nft-form/purchase-nft-form'
import { useAuth } from '@/contexts/auth-context'
import { Environment } from '@/environment'
import { isGreaterThanOrEqual } from '@/utils/format-currency'
import { MAX_BID_FOR_CARD_PAYMENT } from '@/utils/purchase-validation'

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
    return (
      <div className="mx-auto max-w-5xl">
        <EmailVerification inline />
      </div>
    )
  }
  const doesRequireWirePayment =
    Environment.isWireEnabled &&
    ((currentBid &&
      isGreaterThanOrEqual(currentBid, MAX_BID_FOR_CARD_PAYMENT)) ||
      (release.price &&
        isGreaterThanOrEqual(release.price, MAX_BID_FOR_CARD_PAYMENT)))
  return (
    <div className="mx-auto max-w-7xl mt-10">
      {doesRequireWirePayment ? (
        <BankAccountPurchaseForm
          auctionPackId={auctionPackId}
          currentBid={currentBid}
          release={release}
        />
      ) : (
        <PurchaseNFTForm
          auctionPackId={auctionPackId}
          currentBid={currentBid}
          release={release}
        />
      )}
    </div>
  )
}
