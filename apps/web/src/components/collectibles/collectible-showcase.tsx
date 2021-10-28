import { CollectibleWithDetails } from '@algomart/schemas'
import clsx from 'clsx'
import useTranslation from 'next-translate/useTranslation'
import { useMemo } from 'react'

import CollectibleItem from './collectible-item'
import CollectiblePlaceholder from './collectible-placeholder'

import css from './collectible-showcase.module.css'

import AppLink from '@/components/app-link/app-link'
import Toggle from '@/components/toggle/toggle'
import { urls } from '@/utils/urls'

export interface CollectibleShowcaseProps {
  collectibles: CollectibleWithDetails[]
  onClickCollectible: (id: string, index: number) => void
  onTogglePublish?: (publish: boolean) => void
  displayCount?: number
  initialPublish?: boolean
  username?: string | null
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
  const { t } = useTranslation()
  const url = useMemo(() => {
    if (!username) return ''
    const path = urls.profileShowcase.replace(':username', username)
    if (typeof window === 'undefined') return path
    return new URL(path, window.location.origin).href
  }, [username])

  let columnCount = 1

  if ([4, 7, 8].includes(displayCount) || displayCount > 8) {
    columnCount = 4
  } else if ([3, 5, 6].includes(displayCount)) {
    columnCount = 3
  } else if (displayCount === 2) {
    columnCount = 2
  }

  const fillCount = Math.max(displayCount - collectibles.length, 0)
  const fill = Array.from({ length: fillCount }).map((_, index) => (
    <CollectiblePlaceholder
      noBorder
      key={index}
      label={index + 1 + collectibles.length}
    />
  ))

  return (
    <div
      className={clsx(css.root, {
        [css.rootFilled]: !transparent,
        [css.rootTransparent]: transparent,
      })}
    >
      {collectibles.length > 0 ? (
        <>
          <div
            className={clsx(css.container, {
              [css.maxWidth1]: columnCount === 1,
              [css.maxWidth2]: columnCount === 2,
              [css.maxWidth3]: columnCount === 3,
              [css.maxWidth4]: columnCount === 4,
            })}
          >
            {collectibles.map((collectible, index) => (
              <CollectibleItem
                key={collectible.id}
                imageUrl={collectible.image}
                alt={collectible.title}
                mode={mode === 'editing' ? 'remove' : undefined}
                onClick={() => onClickCollectible(collectible.id, index)}
              />
            ))}
            {fill}
          </div>
        </>
      ) : (
        <div className={css.emptyState}>
          {t('collection:viewer.emptyState')}
        </div>
      )}

      {mode === 'editing' && username && (
        <div className={css.toolbar}>
          <div className={css.linkWrapper}>
            <span>
              {t('collection:viewer.Your collection')}
              {': '}
            </span>
            <AppLink href={urls.profileShowcase.replace(':username', username)}>
              {url}
            </AppLink>
          </div>
          <div className={css.toggleWrapper}>
            <Toggle
              checked={initialPublish}
              label={t('collection:viewer.Publish Showcase')}
              styleMode="dark"
              onChange={onTogglePublish}
            />
          </div>
        </div>
      )}
    </div>
  )
}
