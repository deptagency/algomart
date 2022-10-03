import admin from 'firebase-admin'

import { AppConfig } from '@/config'
import { invariant } from '@/utils/invariant'

export default function configureAdmin() {
  invariant(
    typeof window === 'undefined',
    'Firebase Admin client must not be used in browser'
  )

  if (admin.apps.length === 0) {
    admin.initializeApp({
      credential: admin.credential.cert(AppConfig.firebaseServiceAccount),
    })
  }

  return admin
}
