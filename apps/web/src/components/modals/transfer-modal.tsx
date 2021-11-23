import { PackWithId } from '@algomart/schemas'
import {
  CheckCircleIcon,
  ExclamationCircleIcon,
} from '@heroicons/react/outline'
import Image from 'next/image'
import { useRouter } from 'next/router'
import useTranslation from 'next-translate/useTranslation'
import { FormEvent, useCallback, useState } from 'react'

import css from './claim-nft-modal.module.css'

import Button from '@/components/button'
import Dialog, { DialogProps } from '@/components/dialog/dialog'
import Heading from '@/components/heading'
import Loading from '@/components/loading/loading'
import PassphraseInput from '@/components/passphrase-input/passphrase-input'
import { TransferPackStatus } from '@/hooks/use-transfer-pack'
import { urls } from '@/utils/urls'

export interface TransferModalProps {
  onSubmit: (passphrase: string) => Promise<void>
  onRetry: () => void
  packTemplate: PackWithId
  transferStatus: TransferPackStatus
}

export default function TransferModal({
  dialogProps,
  onClose,
  onSubmit,
  onRetry,
  open,
  packTemplate,
  transferStatus,
}: TransferModalProps & DialogProps) {
  const [passphrase, setPassphrase] = useState('')
  const router = useRouter()
  const { t } = useTranslation()

  const handleSubmit = useCallback(
    async (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault()
      await onSubmit(passphrase)
    },
    [onSubmit, passphrase]
  )

  const viewCollection = useCallback(() => {
    router.push(urls.myCollectibles)
  }, [router])

  return (
    <Dialog
      containerClassName={css.container}
      contentClassName={css.dialog}
      onClose={onClose}
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
            onClick={() => onClose(false)}
            variant="tertiary"
          >
            {'\u2717'}
          </Button>
        </header>
        <Heading level={2}>{packTemplate.title}</Heading>

        {transferStatus === TransferPackStatus.Idle && (
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

            {/* Submit */}
            <Button
              fullWidth
              disabled={!passphrase}
              variant="primary"
              type="submit"
            >
              {t('common:actions.Sign')}
            </Button>
          </form>
        )}

        {transferStatus === TransferPackStatus.Transferring && (
          <div className={css.loadingWrapper}>
            <Loading
              loadingText={t('common:statuses.Transferring')}
              variant="secondary"
            />
          </div>
        )}

        {transferStatus === TransferPackStatus.Error && (
          <div className={css.statusWrapper}>
            <ExclamationCircleIcon className={css.errorIcon} />
            <h3 className={css.statusHeading}>
              {t('common:statuses.An Error has Occurred')}
            </h3>
            <p className={css.statusMessage}>{t('release:failedToTransfer')}</p>
            <Button className={css.button} onClick={onRetry} size="small">
              {t('common:actions.Try Again')}
            </Button>
          </div>
        )}

        {transferStatus === TransferPackStatus.Success && (
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
              onClick={viewCollection}
              size="small"
            >
              {t('common:actions.View In My Collection')}
            </Button>
          </div>
        )}
      </div>
    </Dialog>
  )
}
