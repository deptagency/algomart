import { FirebaseApp, getApp, getApps, initializeApp } from 'firebase/app'
import { useEffect, useState } from 'react'

import { useConfig } from './use-config'

export function useFirebaseApp(): FirebaseApp | null {
  const config = useConfig()
  const [app, setApp] = useState<FirebaseApp | null>(null)

  useEffect(() => {
    if (!app) {
      if (getApps().length === 0) {
        if (config.firebaseConfig) {
          setApp(initializeApp(config.firebaseConfig))
        }
      } else {
        setApp(getApp())
      }
    }
  }, [config, app])

  return app
}
