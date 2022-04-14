import { CashIcon, CreditCardIcon, LibraryIcon } from '@heroicons/react/outline'
import Image from 'next/image'
import { useRouter } from 'next/router'
import { Translate } from 'next-translate'
import useTranslation from 'next-translate/useTranslation'

import Heading from '@/components/heading'
import PaymentOptions from '@/components/payment-options'
import EmailVerification from '@/components/profile/email-verification'
import { useAuth } from '@/contexts/auth-context'
import { usePaymentContext } from '@/contexts/payment-context'
import { useConfig } from '@/hooks/use-config'
import { useCurrency } from '@/hooks/use-currency'
import { isGreaterThanOrEqual } from '@/utils/format-currency'
import { MAX_BID_FOR_CARD_PAYMENT } from '@/utils/purchase-validation'

const mastercardIcon = '/images/logos/mastercard.svg'
const visaIcon = '/images/logos/visa.svg'

export default function CheckoutTemplate() {
  const currency = useCurrency()
  const { t } = useTranslation()
  const { user } = useAuth()
  const { pathname, query } = useRouter()
  const { currentBid, release } = usePaymentContext()
  const config = useConfig()

  const doesRequireNonCardPayment =
    (config.isWireEnabled || config.isCryptoEnabled) &&
    ((currentBid &&
      isGreaterThanOrEqual(currentBid, MAX_BID_FOR_CARD_PAYMENT, currency)) ||
      (release?.price &&
        isGreaterThanOrEqual(
          release.price,
          MAX_BID_FOR_CARD_PAYMENT,
          currency
        )))

  const getCardList = (t: Translate) => {
    const baseCards = [
      {
        helpText: t('forms:fields.paymentMethods.options.card.helpText'),
        icon: <CreditCardIcon />,
        title: t('forms:fields.paymentMethods.options.card.label'),
        isDisabled: !!doesRequireNonCardPayment,
        href: {
          pathname: `${pathname}/[method]`,
          query: { ...query, method: 'card', step: 'details' },
        },
        body: (
          <div className="mt-2 -mb-2">
            <Image
              width={60}
              height={40}
              alt={t('forms:fields.ccNumber.logos.visa')}
              src={visaIcon}
            />
            <Image
              width={60}
              height={40}
              alt={t('forms:fields.ccNumber.logos.mastercard')}
              src={mastercardIcon}
            />
          </div>
        ),
      },
    ]
    if (config.isWireEnabled) {
      baseCards.push({
        helpText: t('forms:fields.paymentMethods.options.wire.helpText'),
        icon: <LibraryIcon />,
        title: t('forms:fields.paymentMethods.options.wire.label'),
        isDisabled: false,
        href: {
          pathname: `${pathname}/[method]`,
          query: { ...query, method: 'wire', step: 'details' },
        },
        body: null,
      })
    }
    if (config.isCryptoEnabled) {
      baseCards.push({
        helpText: t('forms:fields.paymentMethods.options.crypto.helpText'),
        icon: <CashIcon />,
        title: t('forms:fields.paymentMethods.options.crypto.label'),
        isDisabled: false,
        href: {
          pathname: `${pathname}/[method]`,
          query: { ...query, method: 'crypto', step: 'details' },
        },
        body: null,
      })
    }
    return baseCards
  }

  if (!user?.emailVerified) {
    return <EmailVerification inline />
  }
  return (
    <>
      <Heading className="mb-10" level={1}>
        {t('forms:fields.paymentMethods.helpText')}
      </Heading>
      <PaymentOptions cards={getCardList(t)} />
    </>
  )
}
