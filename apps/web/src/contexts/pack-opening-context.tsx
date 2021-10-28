import { PackWithCollectibles } from '@algomart/schemas'
import { createContext, ReactNode, useContext, useMemo, useState } from 'react'

interface PackOpening {
  packToOpen: PackWithCollectibles
  setPackToOpen(packToOpen: PackWithCollectibles): void
  sceneMounted: boolean
  setSceneMounted(isActive: boolean): void
  sceneComplete: boolean
  setSceneComplete(isComplete: boolean): void
}

export const PackOpeningContext = createContext<PackOpening | null>(null)

export function usePackOpening() {
  const packOpening = useContext(PackOpeningContext)
  if (!packOpening) throw new Error('PackOpeningProvider missing')
  return packOpening
}

export function usePackOpeningProvider(pack: PackWithCollectibles) {
  const [packToOpen, setPackToOpen] = useState<PackWithCollectibles>(pack)
  const [sceneMounted, setSceneMounted] = useState<boolean>(true)
  const [sceneComplete, setSceneComplete] = useState<boolean>(false)

  const value = useMemo(
    () => ({
      packToOpen,
      setPackToOpen,
      sceneMounted,
      setSceneMounted,
      sceneComplete,
      setSceneComplete,
    }),
    [
      packToOpen,
      setPackToOpen,
      sceneMounted,
      setSceneMounted,
      sceneComplete,
      setSceneComplete,
    ]
  )
  return value
}

export function PackOpeningProvider({
  children,
  pack,
}: {
  children: ReactNode
  pack: PackWithCollectibles
}) {
  const value = usePackOpeningProvider(pack)
  return (
    <PackOpeningContext.Provider value={value}>
      {children}
    </PackOpeningContext.Provider>
  )
}
