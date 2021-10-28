/* eslint-disable simple-import-sort/imports */
// firebase/app must be imported first!
import { Environment } from '@/environment'
import { getApp, getApps, initializeApp } from 'firebase/app'
import 'firebase/auth'
import 'firebase/storage'
/* eslint-enable simple-import-sort/imports */

function loadFirebase() {
  if (getApps().length === 0) {
    return initializeApp(Environment.firebaseConfig)
  }
  return getApp()
}

export default loadFirebase
