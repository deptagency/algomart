import { GetServerSideProps } from 'next'
import { useRouter } from 'next/router'
import useTranslation from 'next-translate/useTranslation'
import { useCallback, useEffect, useState } from 'react'

import { PackAndRedeemCode, useRedemption } from '@/contexts/redemption-context'
import InterstitialLayout from '@/layouts/interstitial-layout'
import RedeemTemplate from '@/templates/redeem-template'
import { urls } from '@/utils/urls'

interface RedeemPageProps {
  prefilledRedeemCode: string
}

export default function RedeemPage({ prefilledRedeemCode }: RedeemPageProps) {
  const { setRedeemable } = useRedemption()
  const { push } = useRouter()
  const [error, setError] = useState<string>('')
  const [redeemCode, setRedeemCode] = useState<string>(prefilledRedeemCode)
  const { t } = useTranslation()

  const handleChange = (value: string) => {
    setRedeemCode(value)
    if (value.length === 12) {
      submitRedeemCode(value)
    }
  }

  const submitRedeemCode = useCallback(
    async (redeemCode: string) => {
      setError('')
      const redeemable = await fetch(urls.api.v1.getRedeemable, {
        body: JSON.stringify({ redeemCode }),
        headers: { 'content-type': 'application/json' },
        method: 'POST',
      })
      if (!redeemable.ok) {
        const error = await redeemable.json()
        setError(error.message)
      } else {
        const result = await redeemable.json()
        setRedeemable(result as PackAndRedeemCode)
        push(urls.login)
      }
    },
    [setRedeemable, push]
  )

  useEffect(() => {
    if (redeemCode.length === 12) {
      submitRedeemCode(redeemCode)
    }
  }, []) /* eslint-disable-line react-hooks/exhaustive-deps */

  return (
    <InterstitialLayout pageTitle={t('common:pageTitles.Redeem')}>
      <RedeemTemplate
        error={error}
        handleChange={handleChange}
        redeemCode={redeemCode}
      />
    </InterstitialLayout>
  )
}

export const getServerSideProps: GetServerSideProps<RedeemPageProps> = async (
  context
) => {
  let prefilledRedeemCode = ''
  if (typeof context.query.redeemCode === 'string') {
    prefilledRedeemCode = context.query.redeemCode
  }
  return { props: { prefilledRedeemCode } }
}
