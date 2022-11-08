import useTranslation from 'next-translate/useTranslation'
import React, {
  DetailedHTMLProps,
  forwardRef,
  VideoHTMLAttributes,
} from 'react'

export interface VideoProps
  extends DetailedHTMLProps<
    VideoHTMLAttributes<HTMLVideoElement>,
    HTMLVideoElement
  > {
  src: string
}

/**
 * A thin wrapper around the HTML5 video element to reduce boilerplate.
 */
function Video({ src, ...rest }, reference) {
  const { t } = useTranslation()

  // Yes, this video tag does need a key attribute
  // https://stackoverflow.com/questions/29291688/video-displayed-in-reactjs-component-not-updating
  return (
    <video ref={reference} key={src} width="100%" {...rest}>
      <source src={src} />
      {t('common:statuses.noVideoSupport')}
    </video>
  )
}

export default forwardRef<HTMLVideoElement, VideoProps>(Video)
