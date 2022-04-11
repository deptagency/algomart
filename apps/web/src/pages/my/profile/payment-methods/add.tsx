import useTranslation from 'next-translate/useTranslation'

import { PaymentProvider } from '@/contexts/payment-context'
import MyProfileLayout from '@/layouts/my-profile-layout'
import MyProfilePaymentMethodsAddTemplate from '@/templates/my-profile-payment-methods-add-template'

export default function MyProfilePaymentMethodsAddPage() {
  const { t } = useTranslation()

  return (
    <MyProfileLayout pageTitle={t('common:pageTitles.Add Payment Method')}>
      <PaymentProvider>
        <MyProfilePaymentMethodsAddTemplate />
      </PaymentProvider>
    </MyProfileLayout>
  )
}
