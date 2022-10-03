import { useRouter } from 'next/router'
import useTranslation from 'next-translate/useTranslation'
import { useCallback } from 'react'

import { H1 } from '@/components/heading'
import Failure from '@/components/kyc/failure'
import KYCInfo from '@/components/kyc/info'
import KYCForm from '@/components/kyc/kyc-form'
import Loading from '@/components/loading/loading'
import { useAuth } from '@/contexts/auth-context'
import { KYCStatus, useKYCContext } from '@/contexts/kyc-context'

export default function MyVerificationTemplate() {
  const { reload } = useRouter()
  const { user } = useAuth()
  const { loadingText, onCreate, status } = useKYCContext()
  const { t } = useTranslation()

  const handleSubmit = useCallback(
    async (body: { firstName: string; lastName: string }) => {
      onCreate({
        ...body,
        email: user.email,
      })
    },
    [onCreate, user?.email]
  )

  return (
    <section className="w-full p-5 lg:p-0">
      <H1 mb={5} level={2} className="md:text-2xl">
        {t('forms:sections.Customer Verification')}
      </H1>
      {status === KYCStatus.idle && <KYCForm handleSubmit={handleSubmit} />}

      {status === KYCStatus.info && <KYCInfo />}

      {status === KYCStatus.loading && <Loading loadingText={loadingText} />}

      {status === KYCStatus.error && <Failure handleRetry={reload} />}
    </section>
  )
}
