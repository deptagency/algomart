import { ImageLoader } from 'next/image'

export const cmsImageLoader: ImageLoader = ({ src, width, quality = 75 }) => {
  return `${src}?width=${width}&quality=${quality}`
}
