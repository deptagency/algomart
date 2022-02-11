import {
  PackAuction,
  PackStatus,
  PackType,
  PublishedPack,
} from '@algomart/schemas'
import { GetServerSideProps } from 'next'
import useTranslation from 'next-translate/useTranslation'
import { useEffect } from 'react'

import { ApiClient } from '@/clients/api-client'
import { Analytics } from '@/clients/firebase-analytics'
import { usePaymentProvider } from '@/contexts/payment-context'
import { Environment } from '@/environment'
import DefaultLayout from '@/layouts/default-layout'
import {
  getAuthenticatedUser,
  handleUnauthenticatedRedirect,
} from '@/services/api/auth-service'
import { urls } from '@/utils/urls'

export interface SuccessPageProps {
  auctionPackId: string | null
  currentBid: number | null
  release: PublishedPack
}

export default function SuccessPage({
  auctionPackId,
  currentBid,
  release,
}: SuccessPageProps) {
  const { t } = useTranslation()
  // const paymentProps = usePaymentProvider({
  //   auctionPackId,
  //   currentBid,
  //   release,
  // })
  return <DefaultLayout pageTitle="Success!" panelPadding></DefaultLayout>
}

export const getServerSideProps: GetServerSideProps<SuccessPageProps> = async (
  context
) => {
  // Verify authentication
  const user = await getAuthenticatedUser(context)
  if (!user) {
    return handleUnauthenticatedRedirect(context.resolvedUrl)
  }

  // @TODO: Get payment
}
