import { CheckoutMethod } from '@algomart/schemas'
import { useRouter } from 'next/router'
import { Translate } from 'next-translate'
import useTranslation from 'next-translate/useTranslation'

import Breadcrumbs from '@/components/breadcrumbs'
import EmailVerification from '@/components/profile/email-verification'
import CardForm from '@/components/purchase-form/cards/card-form'
import CryptoPurchaseForm from '@/components/purchase-form/crypto/crypto-purchase-form'
import BankAccountForm from '@/components/purchase-form/wires/bank-account-form'
import { useAuth } from '@/contexts/auth-context'
import { PaymentContextProps } from '@/contexts/payment-context'
import { urls } from '@/utils/urls'

export default function CheckoutMethodsTemplate(
  paymentProps: PaymentContextProps
) {
  const { user } = useAuth()
  const { query } = useRouter()
  const { t } = useTranslation()
  const { method } = paymentProps
  const { packSlug } = query

  const getPaymentNavItems = (t: Translate) => {
    const basePath = urls.checkoutPackWithMethod
      .replace(':packSlug', packSlug as string)
      .replace(':method', method as string)
    const navItemsBase = [
      {
        label: t('common:nav.payment.Payment Methods'),
        href: urls.checkoutPack.replace(':packSlug', packSlug as string),
      },
      {
        label:
          method === CheckoutMethod.crypto
            ? t('common:nav.payment.Pay with Crypto Wallet')
            : t('common:nav.payment.Payment Information'),
        href: `${basePath}?step=details`,
      },
    ]
    if (method !== CheckoutMethod.crypto) {
      navItemsBase.push({
        label: t('common:nav.payment.Summary'),
        href: `${basePath}?step=summary`,
      })
    }
    return navItemsBase
  }

  if (!user?.emailVerified) {
    return <EmailVerification inline />
  }
  return (
    <>
      {!!method && <Breadcrumbs breadcrumbs={getPaymentNavItems(t)} />}
      {/* Credit cards */}
      {method === CheckoutMethod.card && <CardForm {...paymentProps} />}
      {/* Wire payments */}
      {method === CheckoutMethod.wire && <BankAccountForm {...paymentProps} />}
      {/* Crypto payments */}
      {method === CheckoutMethod.crypto && (
        <CryptoPurchaseForm {...paymentProps} />
      )}
    </>
  )
}
