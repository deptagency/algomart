import { Stripe } from '@stripe/stripe-js'
import useTranslation from 'next-translate/useTranslation'
import { FormEvent, useState } from 'react'

import Button from '@/components/button'

interface VerificationTemplateProps {
  stripe: Stripe
}

export default function VerificationTemplate({
  stripe,
}: VerificationTemplateProps) {
  const { t } = useTranslation()
  const [isSubmitted, setIsSubmitted] = useState<boolean>(false)

  const handleVerification = async (event: FormEvent<HTMLElement>) => {
    event.preventDefault()

    // Call your backend to create the VerificationSession.
    const response = await fetch('/create-verification-session', {
      method: 'POST',
    })
    const session = await response.json()

    // Show the verification modal.
    const { error } = await stripe.verifyIdentity(session.client_secret)

    if (error) {
      console.log('[error]', error)
    } else {
      console.log('Verification submitted!')
      setIsSubmitted(true)
    }
  }

  if (!stripe) {
    // Stripe.js has not loaded yet. Make sure to disable
    // the button until Stripe.js has loaded.
    return
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
