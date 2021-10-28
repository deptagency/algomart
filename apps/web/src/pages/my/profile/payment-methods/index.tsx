import { PaymentCards } from '@algomart/schemas'
import { GetServerSideProps } from 'next'
import useTranslation from 'next-translate/useTranslation'
import { useCallback, useState } from 'react'

import { ApiClient } from '@/clients/api-client'
import MyProfileLayout from '@/layouts/my-profile-layout'
import {
  getAuthenticatedUser,
  handleUnauthenticatedRedirect,
} from '@/services/api/auth-service'
import checkoutService from '@/services/checkout-service'
import MyProfilePaymentMethodsTemplate from '@/templates/my-profile-payment-methods-template'
import { getExpirationDate, isAfterNow } from '@/utils/date-time'
import { sortByDefault, sortByExpirationDate } from '@/utils/sort'

export interface CardsList {
  id: string
  label: string
  default: boolean
  isExpired: boolean
}

export interface MyProfilePaymentMethodsPageProps {
  cards: PaymentCards
}

const toCardsList = (cards: PaymentCards) =>
  cards.map((card) => {
    const expDate = getExpirationDate(
      card.expirationMonth as string,
      card.expirationYear as string
    )
    const isExpired = !isAfterNow(expDate)
    return {
      id: card.id as string,
      label: `${card.network} *${card.lastFour}, ${card.expirationMonth}/${card.expirationYear}`,
      default: card.default,
      isExpired,
    }
  })

export default function MyProfilePaymentMethodsPage({
  cards,
}: MyProfilePaymentMethodsPageProps) {
  const { t } = useTranslation()
  const cardsList = toCardsList(cards)
  const [options, setOptions] = useState<CardsList[]>(cardsList)

  const handleRetrieveCards = useCallback(async () => {
    const cards = await checkoutService.getCards()
    const sortedCardsByExpDate = sortByExpirationDate(cards)
    const sortedCardsByDefault = sortByDefault(sortedCardsByExpDate)
    const cardsList = toCardsList(sortedCardsByDefault)
    setOptions(cardsList)
  }, [])

  const updateCard = useCallback(
    async (cardId: string, defaultCard: boolean) => {
      await checkoutService.updateCard(cardId, defaultCard)
      handleRetrieveCards()
    },
    [handleRetrieveCards]
  )

  const removeCard = useCallback(
    async (cardId: string) => {
      await checkoutService.removeCard(cardId)
      handleRetrieveCards()
    },
    [handleRetrieveCards]
  )

  return (
    <MyProfileLayout pageTitle={t('common:pageTitles.Payment Methods')}>
      <MyProfilePaymentMethodsTemplate
        cards={options}
        removeCard={removeCard}
        updateCard={updateCard}
      />
    </MyProfileLayout>
  )
}

export const getServerSideProps: GetServerSideProps<MyProfilePaymentMethodsPageProps> =
  async (context) => {
    // Verify authentication
    const user = await getAuthenticatedUser(context)
    if (!user || !user.externalId)
      return handleUnauthenticatedRedirect(context.resolvedUrl)

    // Find cards by owner
    const cards = await ApiClient.instance.getCards({
      ownerExternalId: user.externalId,
    })
    const sortedCardsByExpDate = sortByExpirationDate(cards)
    const sortedCardsByDefault = sortByDefault(sortedCardsByExpDate)
    return {
      props: {
        cards: sortedCardsByDefault,
      },
    }
  }
