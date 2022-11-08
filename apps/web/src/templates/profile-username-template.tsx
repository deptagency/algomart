import { CollectibleWithDetails } from '@algomart/schemas'
import useTranslation from 'next-translate/useTranslation'
import { useCallback, useState } from 'react'

import css from './profile-username-template.module.css'

import Avatar from '@/components/avatar/avatar'
import Button from '@/components/button/button'
import CollectibleBrowserDialog from '@/components/collectibles/collectible-browser-dialog'
import CollectibleShowcase from '@/components/collectibles/collectible-showcase'
import { H1 } from '@/components/heading'

export interface ProfileUsernameTemplateProps {
  username: string
  collectibles: CollectibleWithDetails[]
}

export default function ProfileUsernameTemplate({
  username,
  collectibles = [],
}: ProfileUsernameTemplateProps) {
  const { t } = useTranslation()
  const [open, setOpen] = useState(false)
  const [showIndex, setShowIndex] = useState(0)

  const selectCollectible = useCallback((_: string, index: number) => {
    setShowIndex(index)
    setOpen(true)
  }, [])

  const clearCollectible = useCallback(() => {
    setOpen(false)
  }, [])

  return (
    <>
      <div className={css.avatarWrapper}>
        <Avatar username={username} imageOnly size={60} />
      </div>
      <H1 center my={4} size={2}>
        {t('collection:viewer.showcaseTitle', { username })}
      </H1>
      {collectibles.length > 0 && (
        <div className={css.buttonContainer}>
          <Button onClick={() => selectCollectible('', 0)}>
            {t('common:actions.Play All')}
          </Button>
        </div>
      )}
      <CollectibleBrowserDialog
        username={username}
        collectibles={collectibles}
        open={open}
        onClose={clearCollectible}
        initialCollectible={showIndex}
      />
      <div className="mb-8">
        <CollectibleShowcase
          collectibles={collectibles}
          displayCount={collectibles.length}
          mode="viewing"
          onClickCollectible={selectCollectible}
          username={username}
        />
      </div>
    </>
  )
}
