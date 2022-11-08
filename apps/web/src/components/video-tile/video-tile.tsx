/* eslint-disable unicorn/prevent-abbreviations */
import clsx from 'clsx'
import React, { forwardRef, useImperativeHandle, useRef, useState } from 'react'

import css from './video-tile.module.css'

import Video, { VideoProps } from '@/components/video'
import { ReactComponent as PauseIcon } from '@/svgs/pause.svg'
import { ReactComponent as PlayIcon } from '@/svgs/play.svg'

interface VideoTileProps extends VideoProps {
  src: string
}

/**
 * A cropped square-format video that is muted and looped by default and has
 * a custom play/pause button.
 *
 * Future: It may make sense to move the custom play/pause button into the
 * Video component if that's the design direction, but at the moment it's
 * not completely thought through (ie: volume, scrubbing, etc).
 */
function VideoTile(props, reference) {
  const innerRef = useRef<HTMLVideoElement>()
  const [isPlaying, setIsPlaying] = useState(false)

  useImperativeHandle(reference, () => ({
    ...innerRef.current,
    play: async () => {
      await innerRef.current?.play()
      setIsPlaying(true)
    },
    pause: async () => {
      await innerRef.current?.pause()
      setIsPlaying(false)
    },
  }))

  const handlePlay = async () => {
    if (innerRef.current?.paused) {
      await innerRef.current?.play()
      setIsPlaying(true)
    } else {
      await innerRef.current?.pause()
      setIsPlaying(false)
    }
  }

  return (
    <div className={css.root}>
      <div className={css.videoContainer}>
        <Video ref={innerRef} className={css.video} muted {...props} />
      </div>
      <div className={css.curtain}>
        <button
          onClick={handlePlay}
          className={clsx(css.playButton, {
            [css.playing]: isPlaying,
          })}
        >
          {isPlaying ? (
            <PauseIcon strokeWidth={1.5} className={css.icon} />
          ) : (
            <PlayIcon strokeWidth={1.5} className={css.icon} />
          )}
        </button>
      </div>
    </div>
  )
}

export default forwardRef<HTMLVideoElement, VideoTileProps>(VideoTile)
