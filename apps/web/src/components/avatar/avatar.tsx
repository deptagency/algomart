import { UserCircleIcon } from '@heroicons/react/outline'
import clsx from 'clsx'
import Image from 'next/image'
import useTranslation from 'next-translate/useTranslation'

import css from './avatar.module.css'

import { useAvatar } from '@/hooks/api/use-avatar'

export interface AvatarProps {
  className?: string
  imageOnly?: boolean
  prefix?: string
  suffix?: string
  textOnly?: boolean
  username: string
  size?: number
}

export default function Avatar({
  className,
  imageOnly,
  prefix,
  suffix,
  textOnly,
  username,
  size = 36,
}: AvatarProps) {
  const { t } = useTranslation()

  const { data } = useAvatar(username)

  const image =
    !textOnly && data?.profileAvatar ? (
      <Image
        alt={t('common:nav.utility.My profile picture')}
        className={css.image}
        src={data.profileAvatar}
        layout="fill"
        sizes={`${size}px`}
      />
    ) : (
      <UserCircleIcon strokeWidth={1.5} />
    )

  return (
    <div className={clsx(css.root, className)}>
      <div className={css.container}>
        {!textOnly && (
          <div
            className={css.imageContainer}
            style={{ height: size, width: size }}
          >
            {image}
          </div>
        )}
        {!imageOnly && (
          <div className={css.textContent}>
            {prefix && <span>{prefix} </span>}
            <span className={css.username}>
              {textOnly && '@'}
              {username}
            </span>
            {suffix && <span> {suffix}</span>}
          </div>
        )}
      </div>
    </div>
  )
}
