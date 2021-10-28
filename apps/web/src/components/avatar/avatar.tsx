import Image from 'next/image'
import useTranslation from 'next-translate/useTranslation'
import { useEffect, useState } from 'react'

import css from './avatar.module.css'

export interface AvatarProps {
  prefix?: string
  suffix?: string
  username: string
  imageOnly?: boolean
}

export default function Avatar({
  imageOnly,
  prefix,
  suffix,
  username,
}: AvatarProps) {
  const [url, setUrl] = useState<string>('')
  const { t } = useTranslation()

  useEffect(() => {
    if (window) {
      setUrl(
        new URL(`/api/v1/profile/avatar/${username}`, window.location.origin)
          .href
      )
    }
  }, [setUrl, username])
  return (
    <div className={css.root}>
      <div className={css.container}>
        <div className={css.imageContainer}>
          {url && (
            <Image
              alt={t('common:nav.utility.My profile picture')}
              className={css.image}
              src={url}
              layout="responsive"
              height="100%"
              width="100%"
            />
          )}
        </div>
        {!imageOnly && (
          <div className={css.textContent}>
            <p className={css.text}>
              {prefix && <span>{prefix} </span>}
              <span className={css.username}>@{username}</span>
              {suffix && <span> {suffix}</span>}
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
