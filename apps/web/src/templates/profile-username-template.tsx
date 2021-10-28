import { CollectibleWithDetails } from '@algomart/schemas'
import useTranslation from 'next-translate/useTranslation'
import { useCallback, useState } from 'react'

import css from './profile-username-template.module.css'

import Avatar from '@/components/avatar/avatar'
import CollectibleBrowserDialog from '@/components/collectibles/collectible-browser-dialog'
import CollectibleShowcase from '@/components/collectibles/collectible-showcase'
import Heading from '@/components/heading'

export interface ProfileUsernameTemplateProps {
  username: string
  collectibles: CollectibleWithDetails[]
}

export default function ProfileUsernameTemplate({
  username,
  collectibles,
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
        <Avatar username={username} imageOnly />
      </div>
      <Heading className={css.title}>
        {t('collection:viewer.showcaseTitle', { username })}
      </Heading>
      <CollectibleBrowserDialog
        username={username}
        collectibles={collectibles}
        open={open}
        onClose={clearCollectible}
        initialCollectible={showIndex}
      />
      <div>
        <CollectibleShowcase
          transparent
          collectibles={collectibles}
          mode="viewing"
          onClickCollectible={selectCollectible}
          displayCount={collectibles.length}
        />
      </div>
    </>
  )
}
