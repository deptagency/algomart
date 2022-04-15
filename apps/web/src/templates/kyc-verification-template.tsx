import { loadStripe, Stripe } from '@stripe/stripe-js'
import useTranslation from 'next-translate/useTranslation'
import { FormEvent, useEffect, useState } from 'react'

import Button from '@/components/button'
import Loading from '@/components/loading/loading'
import { useConfig } from '@/hooks/use-config'
import { AccountsService } from '@/services/account-service'

export default function VerificationTemplate() {
  const { t } = useTranslation()
  const config = useConfig()
  const [isSubmitted, setIsSubmitted] = useState<boolean>(false)
  const [stripe, setStripe] = useState<Stripe | null>(null)

  useEffect(() => {
    const stripePromiseResolved = async () => {
      const stripePromise = loadStripe(config.stripeKey)
      const stripeResponse = await stripePromise
      if (stripeResponse) {
        setStripe(stripeResponse)
      }
    }
    if (config.stripeKey) {
      stripePromiseResolved()
    }
  }, [config?.stripeKey])

  const handleVerification = async (event: FormEvent<HTMLElement>) => {
    event.preventDefault()

    const session = await AccountsService.instance.createVerificationSession()

    if (!session?.clientSecret) {
      console.error('Verification session could not be created')
      return
    }

    // Show the verification modal.
    const { error } = await stripe.verifyIdentity(session.clientSecret)

    if (error) {
      console.error('Error creating verification session', error)
    } else {
      console.log('Verification submitted!')
      setIsSubmitted(true)
    }
  }

  if (!stripe) {
    // Stripe.js has not loaded yet.
    return <Loading />
  }

  if (isSubmitted) {
    return (
      <>
        <h1>Thanks for submitting your identity document</h1>
        <p>We are processing your verification.</p>
      </>
    )
  }

  return (
    <Button
      disabled={!stripe}
      fullWidth
      onClick={handleVerification}
      type="button"
    >
      {t('common:actions.Verify Identity')}
    </Button>
  )
}
