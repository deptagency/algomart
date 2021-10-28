import { ReactNode } from 'react'

export interface FormFieldProps {
  children: ReactNode
  className?: string
}

export default function FormField({ children, className }: FormFieldProps) {
  return <div className={className}>{children}</div>
}
