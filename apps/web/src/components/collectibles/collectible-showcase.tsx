import { CollectibleWithDetails } from '@algomart/schemas'
import clsx from 'clsx'
import useTranslation from 'next-translate/useTranslation'
import { useMemo } from 'react'

import CollectibleItem from './collectible-item'
import CollectiblePlaceholder from './collectible-placeholder'

import css from './collectible-showcase.module.css'

import AppLink from '@/components/app-link/app-link'
import Toggle from '@/components/toggle/toggle'
import { useAuth } from '@/contexts/auth-context'
import { urlFor, urls } from '@/utils/urls'

export interface CollectibleShowcaseProps {
  collectibles: CollectibleWithDetails[]
  onClickCollectible: (id: string, index: number) => void
  onTogglePublish?: (publish: boolean) => void
  displayCount?: number
  initialPublish?: boolean
  username: string | null
  mode: 'editing' | 'viewing'
  transparent?: boolean
}

export default function CollectibleShowcase({
  collectibles,
  onClickCollectible,
  initialPublish,
  onTogglePublish,
  username,
  displayCount = 8,
  mode,
  transparent,
}: CollectibleShowcaseProps) {
  const auth = useAuth()
  const isCurrentUser = auth.user?.username === username
  const { t } = useTranslation()
  const url = useMemo(() => {
    if (!username) return ''
    const path = urlFor(urls.profileShowcase, { username })
    if (typeof window === 'undefined') return path
    return new URL(path, window.location.origin).href
  }, [username])

  // Determine how big to make the grid
  let columnCount = 1
  if ([4, 7, 8].includes(displayCount) || displayCount > 8) {
    columnCount = 4
  } else if ([3, 5, 6].includes(displayCount)) {
    columnCount = 3
  } else if (displayCount === 2) {
    columnCount = 2
  } else if (displayCount === 0) {
    columnCount = 4
  }

  // Determine how many placeholder tiles to render when editing
  const fillCount = Math.max(displayCount - collectibles.length, 0)
  const fill = Array.from({ length: fillCount }).map((_, index) => (
    <div key={index} className={css.gridCell}>
      <CollectiblePlaceholder
        noBorder
        label={index + 1 + collectibles.length}
      />
    </div>
  ))

  return (
    <div
      className={clsx(css.root, {
        [css.rootFilled]: !transparent,
        [css.rootTransparent]: transparent,
      })}
    >
      <>
        <div
          className={clsx(css.container, {
            [css.maxWidth1]: columnCount === 1,
            [css.maxWidth2]: columnCount === 2,
            [css.maxWidth3]: columnCount === 3,
            [css.maxWidth4]: columnCount === 4,
            [css.isViewing]: mode === 'viewing',
            [css.isEmpty]: collectibles.length === 0,
          })}
        >
          {collectibles.map((collectible, index) => (
            <div className={css.gridCell} key={collectible.id}>
              <CollectibleItem
                collectible={collectible}
                mode={mode === 'editing' ? 'remove' : undefined}
                onClick={() => onClickCollectible(collectible.id, index)}
              />
            </div>
          ))}
          {fill}
          {collectibles.length === 0 && (
            <div className={css.emptyState}>
              {isCurrentUser
                ? t('collection:viewer.emptyStateCurrentUser')
                : t('collection:viewer.emptyState')}
            </div>
          )}
        </div>
      </>

      {mode === 'editing' && username && (
        <div className={css.toolbar}>
          <div className={css.linkWrapper}>
            <span>
              {t('collection:viewer.Your collection')}
              {': '}
            </span>
            <AppLink
              className={css.link}
              href={urlFor(urls.profileShowcase, { username })}
            >
              {url}
            </AppLink>
          </div>
          <Toggle
            checked={initialPublish}
            label={t('collection:viewer.Publish Showcase')}
            onChange={onTogglePublish}
          />
        </div>
      )}
    </div>
  )
}
