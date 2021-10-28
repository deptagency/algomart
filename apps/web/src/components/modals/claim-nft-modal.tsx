import { PackType, PublishedPack } from '@algomart/schemas'
import {
  CheckCircleIcon,
  ExclamationCircleIcon,
} from '@heroicons/react/outline'
import Image from 'next/image'
import useTranslation from 'next-translate/useTranslation'
import { ChangeEvent, FormEvent, useCallback, useEffect, useState } from 'react'

import css from './claim-nft-modal.module.css'

import Button from '@/components/button'
import Dialog, { DialogProps } from '@/components/dialog/dialog'
import Heading from '@/components/heading'
import Loading from '@/components/loading/loading'
import PassphraseInput from '@/components/passphrase-input/passphrase-input'
import TextInput from '@/components/text-input/text-input'
import { useRedemption } from '@/contexts/redemption-context'
import { urls } from '@/utils/urls'

export interface ClaimNFTModalProps {
  onSubmit: (
    passphrase: string,
    redeemCode: string
  ) => Promise<{ packId: string } | string>
  packTemplate: PublishedPack
}

export default function ClaimNFTModal({
  dialogProps,
  onClose,
  onSubmit,
  open,
  packTemplate,
}: ClaimNFTModalProps & DialogProps) {
  const { redeemable } = useRedemption()
  const [error, setError] = useState('')
  const [loadingText, setLoadingText] = useState<string>('')
  const [packId, setPackId] = useState('')
  const [passphrase, setPassphrase] = useState('')
  const [redeemCode, setRedeemCode] = useState('')
  const [status, setStatus] = useState<
    'idle' | 'loading' | 'success' | 'error'
  >('idle')
  const { t } = useTranslation()

  useEffect(() => {
    if (redeemable?.pack.templateId === packTemplate.templateId) {
      setRedeemCode(redeemable.redeemCode)
    }
  }, [redeemable, packTemplate.templateId])

  const handleSubmit = useCallback(
    async (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault()
      setLoadingText(t('common:statuses.Verifying Passphrase'))
      setStatus('loading')
      try {
        const result = await onSubmit(passphrase, redeemCode)
        if (typeof result === 'object' && result.packId) {
          setPackId(result.packId)
          setStatus('success')
        } else {
          setStatus('error')
          setError((result as string) || t('release:failedToClaim'))
        }
      } catch {
        setStatus('error')
      }
    },
    [onSubmit, passphrase, redeemCode, t]
  )

  const handleChangeRedeemCode = (event: ChangeEvent<HTMLInputElement>) => {
    setRedeemCode(event.target.value)
  }

  const handleClose = useCallback(
    (open: boolean) => {
      setStatus('idle')
      setError('')
      onClose(open)
    },
    [onClose]
  )

  const handlePackOpening = useCallback(() => {
    const path = urls.packOpening.replace(':packId', packId)
    if (typeof window !== 'undefined') {
      window.location.assign(new URL(path, window.location.origin).href)
    }
  }, [packId])

  return (
    <Dialog
      containerClassName={css.container}
      contentClassName={css.dialog}
      onClose={handleClose}
      open={open}
      dialogProps={dialogProps}
    >
      <div className={css.root}>
        <header>
          <div className={css.imageWrapper}>
            <Image
              alt={packTemplate.title}
              className={css.image}
              height={140}
              width={140}
              src={`${packTemplate.image}?fit=contain&height=140&width=140&quality=75`}
            />
          </div>
          <Button
            aria-label={t('common:actions.Close')}
            className={css.closeButton}
            onClick={() => handleClose(!open)}
            variant="tertiary"
          >
            {'\u2717'}
          </Button>
        </header>
        <Heading level={2}>{packTemplate.title}</Heading>

        {status === 'idle' && (
          <form className={css.form} onSubmit={handleSubmit}>
            {/* Passphrase */}
            <div className={css.passphrase}>
              <PassphraseInput
                label={t('forms:fields.passphrase.label')}
                handleChange={setPassphrase}
              />
              <p className={css.instructionText}>
                {t('release:passphraseApprove')}
              </p>
            </div>

            {/* Redemption Code */}
            {packTemplate.type === PackType.Redeem &&
              redeemable?.pack.templateId !== packTemplate.templateId && (
                <>
                  <TextInput
                    label={t('forms:fields.redemptionCode.label')}
                    onChange={handleChangeRedeemCode}
                    value={redeemCode}
                    variant="small"
                  />
                  <p className={css.instructionText}>
                    {t('release:redemptionCode')}
                  </p>
                </>
              )}

            {/* Submit */}
            <Button
              fullWidth
              disabled={!passphrase}
              variant="primary"
              type="submit"
            >
              {t('common:actions.Claim My Edition')}
            </Button>
          </form>
        )}

        {status === 'loading' && (
          <div className={css.loadingWrapper}>
            <Loading loadingText={loadingText} variant="secondary" />
          </div>
        )}

        {status === 'error' && (
          <div className={css.statusWrapper}>
            <ExclamationCircleIcon className={css.errorIcon} />
            <h3 className={css.statusHeading}>
              {t('common:statuses.An Error has Occurred')}
            </h3>
            <p className={css.statusMessage}>
              {error || t('release:failedToClaim')}
            </p>
            <Button
              className={css.button}
              onClick={() => {
                handleClose(true)
              }}
              size="small"
            >
              {t('common:actions.Try Again')}
            </Button>
          </div>
        )}

        {status === 'success' && (
          <div className={css.statusWrapper}>
            <CheckCircleIcon className={css.successIcon} />
            <h3 className={css.statusHeading}>
              {t('common:statuses.Success!')}
            </h3>
            <p className={css.statusMessage}>
              {t('release:successConfirmation', { name: packTemplate.title })}
            </p>
            <Button
              className={css.button}
              onClick={handlePackOpening}
              size="small"
            >
              {t('common:actions.Open Pack')}
            </Button>
          </div>
        )}
      </div>
    </Dialog>
  )
}
