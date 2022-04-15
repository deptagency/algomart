import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/outline'
import clsx from 'clsx'
import Image from 'next/image'
import useTranslation from 'next-translate/useTranslation'
import { useState } from 'react'

import css from './media-gallery.module.css'

enum Direction {
  NEXT = 'NEXT',
  PREV = 'PREV',
}

export interface MediaGalleryProps {
  media: string[]
}

export default function MediaGallery({ media }: MediaGalleryProps) {
  const [currentMedia, setCurrentMedia] = useState<string>(media[0])
  const { t } = useTranslation()
  const isSingularAsset = media.length === 1

  // Triggered when selecting a thumbnail
  const handleMediaChange = (medium: string) => {
    setCurrentMedia(medium)
  }

  // Triggered when selecting the previous/next arrows
  const handleMediaBackForth = (direction: Direction) => {
    setCurrentMedia((currentMedia) => {
      const index = media.indexOf(currentMedia)
      if (direction === Direction.PREV) {
        // Go to the previous one. If the first, start from the end
        return index ? media[index - 1] : media[media.length - 1]
      }
      // Go to the next one. If the last, start from the beginning
      return media.length === index + 1 ? media[0] : media[index + 1]
    })
  }

  return (
    <section className={css.mediaGalleryWrapper}>
      <div className={css.selectedImageWrapper}>
        {/* Left/Right arrow controls */}
        {!isSingularAsset && (
          <div className={css.iconWrapper}>
            <button
              aria-label={t('common:actions.Previous')}
              className={clsx(css.leftIcon, css.iconStyle)}
              onClick={() => handleMediaBackForth(Direction.PREV)}
              title={t('common:actions.Previous')}
            >
              <ChevronLeftIcon />
            </button>
            <button
              aria-label={t('common:actions.Next')}
              className={clsx(css.rightIcon, css.iconStyle)}
              onClick={() => handleMediaBackForth(Direction.NEXT)}
              title={t('common:actions.Next')}
            >
              <ChevronRightIcon />
            </button>
          </div>
        )}

        <div className={clsx(css.fullWidth)}>
          {/* Current selected media */}
          <div
            className={clsx(
              css.selectedMediaWrapper,
              css.overflowHidden,
              css.aspect
            )}
          >
            <Image
              alt={t('common:statuses.Selected Image')}
              className={css.contain}
              layout="fill"
              src={currentMedia}
              objectFit="cover"
              sizes="(min-width: 700px) 700px, 100vw"
              priority
            />
          </div>
        </div>
      </div>

      {/* Media thumbnails */}
      {!isSingularAsset && (
        <ul className={css.mediaListGrid}>
          {media.map((medium, index) => (
            <li className={css.aspect} key={medium}>
              <button
                aria-label={t('common:actions.Select Image')}
                className={clsx(
                  css.aspect,
                  css.overflowHidden,
                  css.mediaHyperlinkedWrapper,
                  {
                    [css.opaque]: medium === currentMedia,
                  }
                )}
                onClick={() => handleMediaChange(medium)}
              >
                <Image
                  alt={t('common:actions.View image X of Y', {
                    x: index + 1,
                    y: media.length,
                  })}
                  className={clsx(css.cover, css.fullWidth, css.rounded)}
                  layout="fill"
                  src={medium}
                  objectFit="cover"
                  sizes="25vw"
                />
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
