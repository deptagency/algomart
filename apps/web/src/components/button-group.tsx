import { ReactNode } from 'react'

export interface ButtonGroupProps {
  children: ReactNode
}

export default function ButtonGroup({ children }: ButtonGroupProps) {
  return (
    <div className="relative z-0 inline-flex rounded-sm shadow-sm bg-base-bg">
      {children}
    </div>
  )
}
