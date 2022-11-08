import { PackWithId } from '@algomart/schemas'
import {
  CheckCircleIcon,
  ExclamationCircleIcon,
} from '@heroicons/react/outline'
import Image from 'next/image'
import { useRouter } from 'next/router'
import useTranslation from 'next-translate/useTranslation'
import { FormEvent, useCallback } from 'react'

import css from './claim-nft-modal.module.css'

import Button from '@/components/button'
import Dialog, { DialogProps } from '@/components/dialog/dialog'
import { H2 } from '@/components/heading'
import Loading from '@/components/loading/loading'
import { TransferPackStatus } from '@/hooks/use-transfer-pack'
import { urls } from '@/utils/urls'

export interface TransferModalProps {
  onSubmit: () => Promise<void>
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
  const router = useRouter()
  const { t } = useTranslation()

  const handleSubmit = useCallback(
    async (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault()
      await onSubmit()
    },
    [onSubmit]
  )

  const viewCollection = useCallback(() => {
    router.push(urls.myCollectibles)
    onClose(false) // necessary if already on my collectibles page
  }, [router, onClose])

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
              objectFit="cover"
              src={`${packTemplate.image}?fit=contain&width=240&quality=75`}
            />
          </div>
          <Button
            aria-label={t('common:actions.Close')}
            className={css.closeButton}
            onClick={() => onClose(false)}
            variant="ghost"
          >
            {'\u2717'}
          </Button>
        </header>
        <H2>{packTemplate.title}</H2>

        {transferStatus === TransferPackStatus.Idle && (
          <form className={css.form} onSubmit={handleSubmit}>
            {/* Submit */}
            <Button fullWidth variant="primary" type="submit">
              {t('common:actions.Sign')}
            </Button>
          </form>
        )}

        {transferStatus === TransferPackStatus.Transferring && (
          <div className={css.loadingWrapper}>
            <Loading
              loadingText={t('common:statuses.Transferring Asset')}
              bold
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
            <Button className={css.button} onClick={onRetry}>
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
              {t('release:successTransferConfirmation', {
                name: packTemplate.title,
              })}
            </p>
            <Button
              data-e2e="transfer-success-button"
              className={css.button}
              onClick={viewCollection}
            >
              {t('common:actions.View In My Collection')}
            </Button>
          </div>
        )}
      </div>
    </Dialog>
  )
}
