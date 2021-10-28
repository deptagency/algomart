import { createContext, ReactNode, useContext } from 'react'

import { PackFilter } from '@/hooks/usePackFilter'

export const PackFilterContext = createContext<PackFilter | null>(null)

export function usePackFilterContext() {
  const packFilter = useContext(PackFilterContext)
  if (!packFilter) throw new Error('PackFilterProvider missing')
  return packFilter
}

export function PackFilterProvider({
  children,
  value,
}: {
  children: ReactNode
  value: PackFilter
}) {
  return (
    <PackFilterContext.Provider value={value}>
      {children}
    </PackFilterContext.Provider>
  )
}
