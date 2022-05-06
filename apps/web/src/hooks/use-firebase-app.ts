import type { FirebaseApp } from 'firebase/app'
import { useEffect, useState } from 'react'

import { useConfig } from './use-config'

import { sleep } from '@/utils/sleep'

export async function getFirebaseAppAsync() {
  return import('firebase/app')
}

const MAX_ATTEMPTS = 10
export async function waitForFirebaseAppToBeConfigured() {
  const { getApps } = await getFirebaseAppAsync()
  const check = () => getApps().length === 0
  let attempts = 0
  while (check() && attempts++ < MAX_ATTEMPTS) await sleep(250)
  return check()
}

export function useFirebaseApp(): FirebaseApp | null {
  const config = useConfig()
  const [app, setApp] = useState<FirebaseApp | null>(null)

  useEffect(() => {
    if (!app) {
      ;(async () => {
        const { getApps, initializeApp, getApp } = await getFirebaseAppAsync()
        if (getApps().length === 0) {
          if (config.firebaseConfig) {
            setApp(initializeApp(config.firebaseConfig))
          }
        } else {
          setApp(getApp())
        }
      })()
    }
  }, [config, app])

  return app
}
