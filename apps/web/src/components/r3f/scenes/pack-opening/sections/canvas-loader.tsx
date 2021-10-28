import { useProgress } from '@react-three/drei'
import clsx from 'clsx'

import css from './canvas-loader.module.css'

interface CanvasLoaderProps {
  visible?: boolean
}

export default function CanvasLoader({ visible = true }: CanvasLoaderProps) {
  const { progress } = useProgress()
  const percentage = Math.floor(progress)

  return (
    <div
      className={clsx(css.loaderContainer, {
        [css.invisible]: !visible || percentage === 100,
      })}
    >
      <div
        className={css.loaderProgress}
        style={{ width: `${percentage}%` }}
      ></div>
    </div>
  )
}
