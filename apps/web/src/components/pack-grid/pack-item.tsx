import { CollectibleRarity } from '@algomart/schemas'
import { PhotographIcon } from '@heroicons/react/outline'
import clsx from 'clsx'
import Image from 'next/image'
import useTranslation from 'next-translate/useTranslation'
import { useRef, useState } from 'react'

import css from './pack-item.module.css'

import Button from '@/components/button'
import Pill from '@/components/pill'
import VideoTile from '@/components/video-tile'

export interface PackItemProps {
  calloutText?: string
  imageAlt?: string
  imageSource?: string
  videoSource?: string
  rarity?: CollectibleRarity
  packTitle: string
  title: string
  isInteractive?: boolean
}

export default function PackItem({
  calloutText,
  imageAlt,
  imageSource,
  videoSource,
  rarity,
  packTitle,
  title,
  isInteractive,
}: PackItemProps) {
  const color = rarity?.color
  const { t } = useTranslation('common')
  const videoReference = useRef<HTMLVideoElement>(null)
  const [isFlipped, setIsFlipped] = useState(false)

  const handleFlip = () => {
    if (isFlipped) return
    setIsFlipped(true)
    videoReference.current?.play()
  }

  let media: JSX.Element
  if (videoSource) {
    media = <VideoTile ref={videoReference} src={videoSource} />
  } else if (imageSource) {
    media = (
      <Image
        src={imageSource}
        alt={imageAlt}
        width="100%"
        height="100%"
        layout="responsive"
        objectFit="cover"
        className={css.image}
      />
    )
  } else {
    media = (
      <div className={css.noMedia}>
        <PhotographIcon className={css.noMediaIcon} />
      </div>
    )
  }

  return (
    <li
      className={clsx(css.root, {
        [css.flipped]: isFlipped,
      })}
    >
      <div className="w-full">
        <div className={css.collectible}>
          <div className={css.column}>
            <div className={css.mediaWrapper} style={{ borderColor: color }}>
              {media}
            </div>
            <div className={css.informationWrapper}>
              {calloutText && (
                <div
                  className={clsx(css.calloutWrapper, {
                    [css.defaultColor]: !color,
                  })}
                  style={{ backgroundColor: color }}
                >
                  <p className={css.callout}>{calloutText}</p>
                </div>
              )}
              <div className={css.information}>
                <div className={css.titleWrapper}>
                  <h2 className={css.title}>{title}</h2>
                  <div className={css.packTitle}>{packTitle}</div>
                </div>
                {rarity && (
                  <Pill className="mt-2" color={color}>
                    {rarity.name}
                  </Pill>
                )}
              </div>
            </div>
          </div>
        </div>
        <div
          className={clsx(css.placeholderWrapper, {
            [css.fadeable]: !isInteractive,
            [css.clickable]: isInteractive,
          })}
        >
          <Image
            alt=""
            layout="fill"
            objectFit="cover"
            src="/images/textures/nft-placeholder.png"
          />
          {isInteractive && (
            <Button className={css.openButton} onClick={handleFlip}>
              {t('common:actions.Open')}
            </Button>
          )}
        </div>
      </div>
    </li>
  )
}
