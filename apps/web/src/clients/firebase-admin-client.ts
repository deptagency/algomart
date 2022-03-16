import admin from 'firebase-admin'

import { Environment } from '@/environment'
import { invariant } from '@/utils/invariant'

export default function configureAdmin() {
  invariant(
    typeof window === 'undefined',
    'Firebase Admin client must not be used in browser'
  )

  if (admin.apps.length === 0) {
    admin.initializeApp({
      credential: admin.credential.cert(Environment.firebaseServiceAccount),
    })
  }

  return admin
}
