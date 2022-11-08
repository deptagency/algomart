import { useRouter } from 'next/router'
import useTranslation from 'next-translate/useTranslation'
import { parse } from 'query-string'
import { useEffect, useRef, useState } from 'react'

import { PackAndRedeemCode, useRedemption } from '@/contexts/redemption-context'
import InterstitialLayout from '@/layouts/interstitial-layout'
import RedeemTemplate from '@/templates/redeem-template'
import { useAPI } from '@/utils/react-query'
import { urlFor, urls } from '@/utils/urls'

export default function RedeemPage() {
  const mounted = useRef(false)
  const { setRedeemable } = useRedemption()
  const { push } = useRouter()
  const [error, setError] = useState<string>('')
  const [redeemCode, setRedeemCode] = useState<string>('')
  const { t } = useTranslation()
  const { data, isError } = useAPI<PackAndRedeemCode>(
    ['redeem', redeemCode],
    redeemCode.length === 12
      ? urlFor(urls.api.packs.redeemable, { redeemCode })
      : undefined,
    {
      refetchOnWindowFocus: false,
      retry: false,
    }
  )

  const handleChange = (value: string) => {
    setRedeemCode(value.toUpperCase())
  }

  useEffect(() => {
    if (mounted.current) return
    mounted.current = true

    const initialQuery = parse(window.location.search)
    if (typeof initialQuery.redeemCode === 'string') {
      setRedeemCode(initialQuery.redeemCode)
    }
  }, [])

  useEffect(() => {
    if (data) {
      setRedeemable(data)
      push(urls.loginEmail)
    } else if (isError) {
      setError(t('common:statuses.An Error has Occurred'))
    }
  }, [data, isError, push, setRedeemable, t])

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

export const getServerSideProps = async () => {
  // Hiding this page since redemption isn't supported
  return {
    notFound: false,
  }
}
