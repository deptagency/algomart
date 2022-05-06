import { CheckoutMethod, CheckoutStatus } from '@algomart/schemas'
import { useRouter } from 'next/router'
import { Translate } from 'next-translate'
import useTranslation from 'next-translate/useTranslation'
import { useEffect } from 'react'

import EmailVerification from '@/components/profile/email-verification'
import CardForm from '@/components/purchase-form/cards/card-form'
import CryptoPurchaseForm from '@/components/purchase-form/crypto/crypto-purchase-form'
import BankAccountForm from '@/components/purchase-form/wires/bank-account-form'
import StepLinks from '@/components/step-links'
import { useAuth } from '@/contexts/auth-context'
import { usePaymentContext } from '@/contexts/payment-context'
import { urlFor, urls } from '@/utils/urls'

interface CheckoutMethodsTemplateProps {
  address: string
}

export default function CheckoutMethodsTemplate({
  address,
}: CheckoutMethodsTemplateProps) {
  const { user } = useAuth()
  const { query } = useRouter()
  const { t } = useTranslation()
  const { method, setStatus, setAddress } = usePaymentContext()

  // Set the address retrieved in server side props
  useEffect(() => {
    if (address) {
      setAddress(address)
    }
  }, [address, setAddress])

  // Set the status to the status listed as a query param:
  useEffect(() => {
    if (query.step) {
      const status =
        query?.step === 'details' ? CheckoutStatus.form : CheckoutStatus.summary
      setStatus(status)
    }
  }, [query.step, setStatus])

  const { packSlug } = query

  const getPaymentNavItems = (t: Translate) => {
    const basePath = urlFor(urls.checkoutPackWithMethod, { packSlug, method })
    const navItemsBase = [
      {
        label: t('common:nav.payment.Payment Methods'),
        href: urlFor(urls.checkoutPack, { packSlug }),
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
      {!!method && <StepLinks links={getPaymentNavItems(t)} />}
      {/* Credit cards */}
      {method === CheckoutMethod.card && <CardForm />}
      {/* Wire payments */}
      {method === CheckoutMethod.wire && <BankAccountForm />}
      {/* Crypto payments */}
      {method === CheckoutMethod.crypto && (
        <CryptoPurchaseForm address={address} />
      )}
    </>
  )
}
