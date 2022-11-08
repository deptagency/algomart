import { PaymentCards } from '@algomart/schemas'
import { GetServerSideProps } from 'next'
import useTranslation from 'next-translate/useTranslation'
import { useCallback, useState } from 'react'

import Async from '@/components/async/async'
import MyProfileLayout from '@/layouts/my-profile-layout'
import {
  getAuthenticatedUser,
  getTokenFromCookie,
  handleUnauthenticatedRedirect,
} from '@/services/api/auth-service'
import { CheckoutService } from '@/services/checkout-service'
import MyProfilePaymentMethodsTemplate from '@/templates/my-profile-payment-methods-template'
import { getExpirationDate, isAfterNow } from '@/utils/date-time'
import { apiFetcher } from '@/utils/react-query'
import { sortByDefault, sortByExpirationDate } from '@/utils/sort'
import { urls } from '@/utils/urls'

export interface CardsList {
  id: string
  label: string
  default: boolean
  isExpired: boolean
  network: string
}

export interface MyProfilePaymentMethodsPageProps {
  cards: PaymentCards
}

const toCardsList = (cards: PaymentCards) =>
  cards.map((card) => {
    const expDate = getExpirationDate(card.expirationMonth, card.expirationYear)
    return {
      id: card.id,
      label: `*${card.lastFour}, ${card.expirationMonth}/${card.expirationYear}`,
      default: card.default,
      network: card.network,
      isExpired: !isAfterNow(expDate),
    }
  })

export default function MyProfilePaymentMethodsPage({
  cards,
}: MyProfilePaymentMethodsPageProps) {
  const { t } = useTranslation()
  const cardsList = toCardsList(cards)
  const [options, setOptions] = useState<CardsList[]>(cardsList)
  const [busy, setBusy] = useState(false)

  const fetchCards = useCallback(async () => {
    const cards = await CheckoutService.instance.getCards()
    const sortedCardsByExpDate = sortByExpirationDate(cards)
    const sortedCardsByDefault = sortByDefault(sortedCardsByExpDate)
    const cardsList = toCardsList(sortedCardsByDefault)
    setOptions(cardsList)
  }, [])

  const updateCard = useCallback(
    async (cardId: string, defaultCard: boolean) => {
      setBusy(true)
      await CheckoutService.instance.updateCard(cardId, defaultCard)
      fetchCards()
      setBusy(false)
    },
    [fetchCards]
  )

  const removeCard = useCallback(
    async (cardId: string) => {
      setBusy(true)
      await CheckoutService.instance.removeCard(cardId)
      fetchCards()
      setBusy(false)
    },
    [fetchCards]
  )

  return (
    <MyProfileLayout pageTitle={t('common:pageTitles.Payment Methods')}>
      <Async isLoading={busy}>
        <MyProfilePaymentMethodsTemplate
          cards={options}
          removeCard={removeCard}
          updateCard={updateCard}
        />
      </Async>
    </MyProfileLayout>
  )
}

export const getServerSideProps: GetServerSideProps<
  MyProfilePaymentMethodsPageProps
> = async (context) => {
  // Verify authentication
  const user = await getAuthenticatedUser(context)
  if (!user || !user.externalId)
    return handleUnauthenticatedRedirect(context.resolvedUrl)

  // Find cards by owner
  const cards = await apiFetcher().get<PaymentCards>(urls.api.payments.cards, {
    bearerToken: getTokenFromCookie(context.req, context.res),
  })
  const sortedCardsByExpDate = sortByExpirationDate(cards)
  const sortedCardsByDefault = sortByDefault(sortedCardsByExpDate)
  return {
    props: {
      cards: sortedCardsByDefault,
    },
  }
}
