import { CheckoutMethod, CheckoutStatus } from '@algomart/schemas'
import { CashIcon, CreditCardIcon, LibraryIcon } from '@heroicons/react/outline'
import { useRouter } from 'next/router'
import { Translate } from 'next-translate'
import useTranslation from 'next-translate/useTranslation'

import Breadcrumbs from '@/components/breadcrumbs'
import Cards from '@/components/cards'
import CardForm from '@/components/purchase-form/cards/card-form'
import CryptoPurchaseForm from '@/components/purchase-form/crypto/crypto-purchase-form'
import BankAccountForm from '@/components/purchase-form/wires/bank-account-form'
import { PaymentContextProps } from '@/contexts/payment-context'
import { Environment } from '@/environment'
import { isGreaterThanOrEqual } from '@/utils/format-currency'
import { MAX_BID_FOR_CARD_PAYMENT } from '@/utils/purchase-validation'
import { urls } from '@/utils/urls'

export default function PurchaseForm(paymentProps: PaymentContextProps) {
  const { t } = useTranslation()
  const { asPath, push } = useRouter()
  const { address, currentBid, handleSetStatus, method, release, setMethod } =
    paymentProps

  if (!release) {
    push(urls.releases)
  }

  const doesRequireNonCardPayment =
    (Environment.isWireEnabled || Environment.isCryptoEnabled) &&
    ((currentBid &&
      isGreaterThanOrEqual(currentBid, MAX_BID_FOR_CARD_PAYMENT)) ||
      (release?.price &&
        isGreaterThanOrEqual(release.price, MAX_BID_FOR_CARD_PAYMENT)))

  const getCardList = (t: Translate) => {
    const baseCards = [
      {
        helpText: t('forms:fields.paymentMethods.options.card.helpText'),
        icon: <CreditCardIcon />,
        title: t('forms:fields.paymentMethods.options.card.label'),
        isDisabled: !!doesRequireNonCardPayment,
        href: `${asPath.split('?')[0]}?method=card&step=details`,
        handleClick: () => handleSetStatus(CheckoutStatus.form),
      },
    ]
    if (Environment.isWireEnabled) {
      baseCards.push({
        helpText: t('forms:fields.paymentMethods.options.wire.helpText'),
        icon: <LibraryIcon />,
        title: t('forms:fields.paymentMethods.options.wire.label'),
        isDisabled: false,
        href: `${asPath.split('?')[0]}?method=wire&step=details`,
        handleClick: () => handleSetStatus(CheckoutStatus.form),
      })
    }
    if (Environment.isCryptoEnabled) {
      baseCards.push({
        helpText: t('forms:fields.paymentMethods.options.crypto.helpText'),
        icon: <CashIcon />,
        title: t('forms:fields.paymentMethods.options.crypto.label'),
        isDisabled: !address,
        href: `${asPath.split('?')[0]}?method=crypto&step=details`,
        handleClick: () => handleSetStatus(CheckoutStatus.form),
      })
    }
    return baseCards
  }

  const getPaymentNavItems = (t: Translate) => {
    const navItemsBase = [
      {
        label: t('common:nav.payment.Payment Methods'),
        href: asPath.split('?')[0],
        handleClick: () => setMethod(null),
      },
      {
        label:
          method === CheckoutMethod.crypto
            ? t('common:nav.payment.Pay with Crypto Wallet')
            : t('common:nav.payment.Payment Information'),
        href: `${asPath.split('?')[0]}?method=${method}&step=details`,
        handleClick: () => handleSetStatus(CheckoutStatus.form),
      },
    ]
    if (method !== CheckoutMethod.crypto) {
      navItemsBase.push({
        label: t('common:nav.payment.Summary'),
        href: `${asPath.split('?')[0]}?method=${method}&step=summary`,
        handleClick: () => handleSetStatus(CheckoutStatus.summary),
      })
    }
    return navItemsBase
  }

  return (
    <section>
      {/* Select method */}
      {method ? (
        <Breadcrumbs breadcrumbs={getPaymentNavItems(t)} />
      ) : (
        <Cards
          header={t('forms:fields.paymentMethods.helpText')}
          cards={getCardList(t)}
        />
      )}
      {/* Credit cards */}
      {method === CheckoutMethod.card && <CardForm {...paymentProps} />}
      {/* Wire payments */}
      {method === CheckoutMethod.wire && <BankAccountForm {...paymentProps} />}
      {/* Crypto payments */}
      {method === CheckoutMethod.crypto && (
        <CryptoPurchaseForm {...paymentProps} />
      )}
    </section>
  )
}
