import { PackType, PublishedPack } from '@algomart/schemas'
import {
  CheckCircleIcon,
  ExclamationCircleIcon,
} from '@heroicons/react/outline'
import Image from 'next/image'
import useTranslation from 'next-translate/useTranslation'
import { FormEvent, useCallback, useEffect, useMemo, useState } from 'react'

import css from './claim-nft-modal.module.css'

import Button from '@/components/button'
import Dialog, { DialogProps } from '@/components/dialog/dialog'
import { H2 } from '@/components/heading'
import InputField from '@/components/input-field'
import Loading from '@/components/loading/loading'
import { useRedemption } from '@/contexts/redemption-context'
import {
  TransferPackStatus,
  useTransferPackStatus,
} from '@/hooks/use-transfer-pack'
import { urlFor, urls } from '@/utils/urls'

export interface ClaimNFTModalProps {
  onSubmit: (redeemCode: string) => Promise<{ packId: string } | string>
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
  const [packId, setPackId] = useState('')
  const [redeemCode, setRedeemCode] = useState('')
  const { t } = useTranslation()
  const [status, count] = useTransferPackStatus(packId)

  useEffect(() => {
    if (redeemable?.pack.templateId === packTemplate.templateId) {
      setRedeemCode(redeemable.redeemCode)
    }
  }, [redeemable, packTemplate.templateId])

  const handleSubmit = useCallback(
    async (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault()
      try {
        const result = await onSubmit(redeemCode)
        if (typeof result === 'string') {
          setError(result)
        } else {
          setPackId(result.packId)
        }
      } catch {
        setError(t('release:failedToClaim'))
      }
    },
    [onSubmit, redeemCode, t]
  )

  const handleClose = useCallback(
    (open: boolean) => {
      setPackId('')
      setError('')
      onClose(open)
    },
    [onClose]
  )

  const handlePackOpening = useCallback(() => {
    const path = urlFor(urls.packOpening, { packId })
    if (typeof window !== 'undefined') {
      window.location.assign(new URL(path, window.location.origin).href)
    }
  }, [packId])

  const loadingText = useMemo(() => {
    return {
      [TransferPackStatus.Minting]: t('common:statuses.Minting NFT', {
        count,
      }),
      [TransferPackStatus.Transferring]: t('common:statuses.Transferring NFT', {
        count,
      }),
    }[status]
  }, [t, count, status])

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
              height={180}
              width={180}
              objectFit="cover"
              src={`${packTemplate.image}?fit=contain&width=240&quality=75`}
            />
          </div>
          <Button
            aria-label={t('common:actions.Close')}
            className={css.closeButton}
            onClick={() => handleClose(!open)}
            variant="ghost"
          >
            {'\u2717'}
          </Button>
        </header>
        <H2>{packTemplate.title}</H2>

        {!error && status === 'idle' && (
          <form className={css.form} onSubmit={handleSubmit}>
            {/* Redemption Code */}
            {packTemplate.type === PackType.Redeem &&
              redeemable?.pack.templateId !== packTemplate.templateId && (
                <>
                  <InputField
                    label={t('forms:fields.redemptionCode.label')}
                    onChange={setRedeemCode}
                    value={redeemCode}
                    density="compact"
                  />
                  <p className={css.instructionText}>
                    {t('release:redemptionCode')}
                  </p>
                </>
              )}

            {/* Submit */}
            <Button fullWidth type="submit">
              {t('common:actions.Claim My Edition')}
            </Button>
          </form>
        )}

        {loadingText && (
          <div className={css.loadingWrapper}>
            <Loading loadingText={loadingText} bold />
          </div>
        )}

        {(error || status === 'error') && (
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
              {t('release:successOwnershipConfirmation', {
                name: packTemplate.title,
              })}
            </p>
            <Button className={css.button} onClick={handlePackOpening}>
              {t('common:actions.Open Pack')}
            </Button>
          </div>
        )}
      </div>
    </Dialog>
  )
}
