import { PublishedPack } from '@algomart/schemas'
import useTranslation from 'next-translate/useTranslation'

import Breadcrumbs from '@/components/breadcrumbs'
import PurchaseNFTForm from '@/components/payments/cards/card-form'
import EmailVerification from '@/components/profile/email-verification'
import { useAuth } from '@/contexts/auth-context'
import { getPaymentNavItems } from '@/utils/navigation'

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
  const { t } = useTranslation()
  const { user } = useAuth()
  const navItems = getPaymentNavItems(t)
  if (!user?.emailVerified) {
    return <EmailVerification inline />
  }
  return (
    <>
      <Breadcrumbs breadcrumbs={navItems} />
      <PurchaseNFTForm
        auctionPackId={auctionPackId}
        currentBid={currentBid}
        release={release}
      />
    </>
  )
}
