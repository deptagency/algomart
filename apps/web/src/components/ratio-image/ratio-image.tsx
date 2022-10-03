import Image, { ImageProps } from 'next/image'
import { useState } from 'react'

export default function RatioImage({
  alt,
  src,
  height,
}: Omit<ImageProps, 'width'>) {
  // NOTE: The `width` prop is not used as it is automatically generated via the
  // aspect ratio that derived from the natural height and width of the image
  const [aspectRatio, setAspectRatio] = useState(1)
  const derivedWidth = Number.parseInt(String(height), 10) / aspectRatio

  return (
    <Image
      alt={alt}
      src={src}
      height={height}
      width={derivedWidth}
      onLoadingComplete={({ naturalHeight, naturalWidth }) => {
        setAspectRatio(naturalHeight / naturalWidth)
      }}
    />
  )
}
