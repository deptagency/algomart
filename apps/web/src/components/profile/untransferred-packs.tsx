import clsx from 'clsx'
import { useRouter } from 'next/router'
import useTranslation from 'next-translate/useTranslation'
import { useCallback, useEffect, useState } from 'react'

import Banner from '../banner/banner'
import Button from '../button'
import TransferModal from '../modals/transfer-modal'

import css from './email-verification.module.css'

import { TransferPackStatus, useTransferPack } from '@/hooks/use-transfer-pack'
import { useUntransferredPacks } from '@/hooks/use-untransferred-packs'
import { urls } from '@/utils/urls'

export default function UntransferredPacks() {
  const { data, mutate } = useUntransferredPacks()
  const [open, setOpen] = useState(false)
  const router = useRouter()
  const { t } = useTranslation()
  const [transfer, status, reset] = useTransferPack(
    data && data.total > 0 ? data.packs[0].id : null
  )

  const onClose = useCallback(() => {
    setOpen(false)
  }, [])

  const onOpen = useCallback(() => {
    setOpen(true)
  }, [])

  const onSubmit = useCallback(
    async (passphrase: string) => {
      await transfer(passphrase)
    },
    [transfer]
  )

  useEffect(() => {
    if (status === TransferPackStatus.Success && !open) {
      const newPacks = data?.packs.slice(1) || []
      mutate({
        packs: newPacks,
        total: newPacks.length,
      })
      reset()
    }
  }, [data?.packs, mutate, open, reset, status])

  if (
    !data ||
    data.total === 0 ||
    router.asPath === urls.packOpening.replace(':packId', data.packs[0].id) ||
    router.pathname === urls.checkout
  )
    return null

  return (
    <Banner className={clsx(css.wrapper)}>
      <p>{t('release:You have N unclaimed packs', { count: data.total })}</p>
      <p className={css.emailVerificationControls}>
        <Button size="small" variant="primary" onClick={onOpen}>
          {t('common:actions.Save to My Collection')}
        </Button>
      </p>
      <TransferModal
        packTemplate={data.packs[0]}
        onClose={onClose}
        onRetry={reset}
        onSubmit={onSubmit}
        open={open}
        transferStatus={status}
      />
    </Banner>
  )
}
