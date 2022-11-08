import { CollectibleWithDetails } from '@algomart/schemas'
import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/outline'
import clsx from 'clsx'
import Image from 'next/image'
import { useRouter } from 'next/router'
import useTranslation from 'next-translate/useTranslation'
import { useCallback, useEffect, useRef, useState } from 'react'

import css from './collectible-browser.module.css'

import { H1 } from '@/components/heading'
import Video from '@/components/video'

export interface CollectibleBrowserProps {
  collectibles: CollectibleWithDetails[]
  initialCollectible?: number
}

export default function CollectibleBrowser({
  collectibles,
  initialCollectible = 0,
}: CollectibleBrowserProps) {
  const [current, setCurrent] = useState(initialCollectible)
  const [showVideoCoverImage, setShowVideoCoverImage] = useState(false)
  const collectible = collectibles[current]

  const videoReference = useRef<HTMLVideoElement>(null)
  const router = useRouter()
  const { t } = useTranslation()

  const goBack = useCallback(() => {
    setCurrent((index) => {
      let next = index - 1
      if (next < 0) {
        next = collectibles.length - 1
      }
      return next
    })
  }, [collectibles])

  const goForward = useCallback(() => {
    setCurrent((index) => {
      let next = index + 1
      if (next >= collectibles.length) {
        next = 0
      }
      return next
    })
  }, [collectibles])

  const handleFlip = useCallback(() => {
    setShowVideoCoverImage(!showVideoCoverImage)
    if (!showVideoCoverImage) {
      videoReference.current?.pause()
    } else {
      videoReference.current?.play()
    }
  }, [showVideoCoverImage])

  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      switch (event.key) {
        case 'ArrowLeft':
          goBack()
          break
        case 'ArrowRight':
          goForward()
          break
        case 'Escape':
      }
    }

    document.addEventListener('keydown', handler)

    return () => {
      document.removeEventListener('keydown', handler)
    }
  }, [goBack, goForward])

  return (
    <div className={css.root}>
      <H1 className={css.title}>{collectible.title}</H1>
      {collectible.previewVideo && (
        <button onClick={handleFlip} className={css.flipButton}>
          {showVideoCoverImage
            ? t('collection:viewer.show video')
            : t('collection:viewer.show cover')}
        </button>
      )}
      <div className={css.imageWrapper}>
        {!collectible.previewVideo && (
          <Image
            src={collectible.image}
            width={700}
            height={700}
            layout="responsive"
            objectFit="contain"
            alt={collectible.title}
          />
        )}
        {collectible.previewVideo && (
          <div
            className={clsx(css.flipBox, {
              [css.flip]: showVideoCoverImage,
            })}
          >
            <div className={css.flipBoxInner}>
              <div className={css.flipBoxFront}>
                <Video
                  ref={videoReference}
                  controls
                  autoPlay
                  loop
                  src={collectible.previewVideo}
                />
              </div>
              <div className={css.flipBoxBack}>
                <Image
                  src={collectible.image}
                  alt={collectible.title}
                  width={700}
                  height={700}
                  layout="responsive"
                  objectFit="contain"
                />
              </div>
            </div>
          </div>
        )}
        <button
          className={clsx(css.navButton, css.navButtonLeft)}
          onClick={goBack}
        >
          <ChevronLeftIcon width={32} height={64} />
        </button>
        <button
          className={clsx(css.navButton, css.navButtonRight)}
          onClick={goForward}
        >
          <ChevronRightIcon width={32} height={64} />
        </button>
      </div>
      <div className={css.detail}>
        <div className={css.detailLeft}>
          <span className={css.emphasize}>#{collectible.edition}</span>
          <span> {t('collection:viewer.of')} </span>
          <span className={css.emphasize}>{collectible.totalEditions}</span>
        </div>
        <div className={css.detailCenter}>{collectible.subtitle}</div>
        {collectible.claimedAt && (
          <div className={css.detailRight}>
            <span>{t('collection:viewer.collected')} </span>
            <span className={css.emphasize}>
              {new Date(collectible.claimedAt).toLocaleDateString(
                router.locale,
                {
                  dateStyle: 'long',
                }
              )}
            </span>
          </div>
        )}
      </div>

      {collectibles.length > 1 && (
        <div className={css.gallery}>
          {collectibles.map((c, index) => (
            <button
              key={c.id}
              onClick={() => setCurrent(index)}
              className={clsx(css.galleryButton, {
                [css.galleryButtonUnselected]: index !== current,
              })}
            >
              <Image
                src={c.image}
                width={70}
                height={70}
                objectFit="contain"
                layout="responsive"
                alt={collectible.title}
              />
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
