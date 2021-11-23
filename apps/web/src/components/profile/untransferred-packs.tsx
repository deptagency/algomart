import clsx from 'clsx'
import useTranslation from 'next-translate/useTranslation'
import { useState } from 'react'

import Banner from '../banner/banner'
import Button from '../button'
import TransferModal from '../modals/transfer-modal'

import css from './email-verification.module.css'

import { useTransferPack } from '@/hooks/use-transfer-pack'
import { useUntransferredPacks } from '@/hooks/use-untransferred-packs'

export default function UntransferredPacks() {
  const { data } = useUntransferredPacks()
  const [open, setOpen] = useState(false)
  const { t } = useTranslation()
  const [transfer, status, reset] = useTransferPack(
    data && data.total > 0 ? data.packs[0].id : null
  )

  if (!data || data.total === 0) return null

  return (
    <Banner className={clsx(css.wrapper)}>
      <p>{t('release:You have N unclaimed packs', { count: data.total })}</p>
      <p className={css.emailVerificationControls}>
        <Button
          size="small"
          variant="primary"
          onClick={() => {
            setOpen(true)
          }}
        >
          {t('common:actions.Save to My Collection')}
        </Button>
      </p>
      <TransferModal
        packTemplate={data.packs[0]}
        onClose={() => {
          setOpen(false)
        }}
        onRetry={reset}
        onSubmit={transfer}
        open={open}
        transferStatus={status}
      />
    </Banner>
  )
}
