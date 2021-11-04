import { CollectibleWithDetails } from '@algomart/schemas'
import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/outline'
import clsx from 'clsx'
import Image from 'next/image'
import { useRouter } from 'next/router'
import useTranslation from 'next-translate/useTranslation'
import { useCallback, useEffect, useState } from 'react'

import css from './collectible-browser.module.css'

import Heading from '@/components/heading'
import { cmsImageLoader } from '@/utils/cms-image-loader'

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
      <Heading className={css.title}>{collectible.title}</Heading>
      {collectible.previewVideo && (
        <button
          onClick={() => setShowVideoCoverImage(!showVideoCoverImage)}
          className={css.flipButton}
        >
          {showVideoCoverImage ? 'show video' : 'show cover'}
        </button>
      )}
      <div className={css.imageWrapper}>
        {!collectible.previewVideo && (
          <Image
            src={collectible.image}
            loader={cmsImageLoader}
            width={700}
            height={700}
            layout="responsive"
            objectFit="contain"
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
                {/* Yes, this video tag does need a key attribute 
                https://stackoverflow.com/questions/29291688/video-displayed-in-reactjs-component-not-updating 
                */}
                <video
                  width="100%"
                  controls
                  muted
                  autoPlay
                  loop
                  key={collectible.previewVideo}
                >
                  <source src={collectible.previewVideo} type="video/mp4" />
                  {t('common:statuses.noVideoSupport')}
                </video>
              </div>
              <div className={css.flipBoxBack}>
                <Image
                  src={collectible.image}
                  loader={cmsImageLoader}
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
        <div>
          <span className={css.bold}>#{collectible.edition}</span>
          <span> {t('collection:viewer.of')} </span>
          <span className={css.bold}>{collectible.totalEditions}</span>
        </div>
        <div className={css.detailCenter}>{collectible.subtitle}</div>
        {collectible.claimedAt && (
          <div className={css.detailRight}>
            <span>{t('collection:viewer.collected')} </span>
            <span className={css.bold}>
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
                loader={cmsImageLoader}
                width={70}
                height={70}
                objectFit="contain"
                layout="responsive"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
