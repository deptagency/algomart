import { XCircleIcon } from '@heroicons/react/solid'
import useTranslation from 'next-translate/useTranslation'
import { useEffect } from 'react'

import CollectibleBrowser, {
  CollectibleBrowserProps,
} from './collectible-browser'

import css from './collectible-browser-dialog.module.css'

import Avatar from '@/components/avatar/avatar'
import Button from '@/components/button'
import Dialog from '@/components/dialog/dialog'

export interface CollectibleBrowserDialogProps extends CollectibleBrowserProps {
  open: boolean
  username: string
  isCurrentUser?: boolean
  onClose: () => void
}

export default function CollectibleBrowserDialog({
  open,
  username,
  isCurrentUser,
  onClose,
  collectibles,
  initialCollectible,
}: CollectibleBrowserDialogProps) {
  const { t } = useTranslation()

  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      switch (event.key) {
        case 'Escape':
          onClose()
          break
      }
    }

    document.addEventListener('keydown', handler)

    return () => {
      document.removeEventListener('keydown', handler)
    }
  }, [onClose])

  return (
    <Dialog
      open={open}
      onClose={onClose}
      containerClassName={css.container}
      contentClassName={css.content}
      overlayClassName={css.overlay}
    >
      <div className={css.root}>
        <div>
          <Avatar
            prefix={t('collection:viewer.ownedBy')}
            suffix={isCurrentUser ? t('collection:viewer.thatsYou') : undefined}
            username={username}
          />
        </div>
        <Button
          aria-label={t('common:actions.Close')}
          onClick={onClose}
          className={css.closeButton}
          variant="tertiary"
        >
          <XCircleIcon />
        </Button>
      </div>

      <div className={css.browserWrapper}>
        <CollectibleBrowser
          initialCollectible={initialCollectible}
          collectibles={collectibles}
        />
      </div>
    </Dialog>
  )
}
