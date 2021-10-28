import { ReactNode } from 'react'

import css from './canvas-container.module.css'

interface CanvasContainerProps {
  children: ReactNode
}

export default function CanvasContainer({ children }: CanvasContainerProps) {
  return <section className={css.canvasContainer}>{children}</section>
}
