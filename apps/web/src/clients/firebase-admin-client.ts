import admin from 'firebase-admin'

import { Environment } from '@/environment'

export default function configureAdmin() {
  if (admin.apps.length === 0) {
    admin.initializeApp({
      credential: admin.credential.cert(Environment.firebaseServiceAccount),
    })
  }

  return admin
}
