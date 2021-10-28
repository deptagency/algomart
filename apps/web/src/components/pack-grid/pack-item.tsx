import { PhotographIcon } from '@heroicons/react/outline'
import clsx from 'clsx'
import Image from 'next/image'
import useTranslation from 'next-translate/useTranslation'

import css from './pack-item.module.css'

export interface PackItemProps {
  calloutText?: string
  color?: string
  imageAlt?: string
  imageSource?: string
  labelName?: string
  title: string
}

export default function PackItem({
  calloutText,
  color,
  imageAlt,
  imageSource,
  labelName,
  title,
}: PackItemProps) {
  const { t } = useTranslation('common')
  const label = labelName || t('common:global.rarityDefault')
  return (
    <div className={css.root}>
      <div className={css.column}>
        <div className={css.imageWrapper}>
          {imageSource ? (
            <Image
              src={imageSource}
              alt={imageAlt}
              width="100%"
              height="100%"
              layout="responsive"
              className={css.image}
            />
          ) : (
            <div className={css.placeholder}>
              <PhotographIcon className={css.icon} />
            </div>
          )}
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
            <h1 className={css.title}>{title}</h1>
            <span
              className={clsx(css.label, {
                [css.defaultColor]: !color,
                backgroundColor: color,
              })}
              style={{ backgroundColor: color }}
            >
              {label}
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
