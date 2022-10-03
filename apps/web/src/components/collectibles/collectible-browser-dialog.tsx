import { XCircleIcon } from '@heroicons/react/outline'
import useTranslation from 'next-translate/useTranslation'
import { useEffect } from 'react'

import CollectibleBrowser, {
  CollectibleBrowserProps,
} from './collectible-browser'

import css from './collectible-browser-dialog.module.css'

import Avatar from '@/components/avatar/avatar'
import Dialog from '@/components/dialog/dialog'

export interface CollectibleBrowserDialogProps extends CollectibleBrowserProps {
  isAlgoAddress?: boolean
  isCurrentUser?: boolean
  onClose: () => void
  open: boolean
  username: string
}

export default function CollectibleBrowserDialog({
  collectibles,
  initialCollectible,
  isAlgoAddress,
  isCurrentUser,
  onClose,
  open,
  username,
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
          {username && (
            <Avatar
              prefix={t('collection:viewer.ownedBy')}
              suffix={
                isCurrentUser ? t('collection:viewer.thatsYou') : undefined
              }
              textOnly={isAlgoAddress}
              username={username}
            />
          )}
        </div>
        <button
          aria-label={t('common:actions.Close')}
          onClick={onClose}
          className={css.closeButton}
        >
          <XCircleIcon />
        </button>
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
