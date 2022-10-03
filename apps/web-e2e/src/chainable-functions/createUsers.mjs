import { initializeApp } from 'firebase/app'
import {
  createUserWithEmailAndPassword,
  getAuth,
  signInWithEmailAndPassword,
  signOut,
} from 'firebase/auth'
import admin from 'firebase-admin'
import axios from 'axios'

// Firebase auth setup
const app = initializeApp(JSON.parse(process.env.firebaseOptions))
const auth = getAuth(app)

// Firebase admin setup
admin.initializeApp({
  credential: admin.credential.cert(
    JSON.parse(process.env.firebaseServiceAccount)
  ),
})

if (!process.env.email) console.error('no email provided')
if (!process.env.password) console.error('no password provided')
if (!process.env.username) console.error('no username provided')

async function createUserInDB(externalId, username, email, token) {
  try {
    await axios.post(
      `${process.env.apiURL}/accounts`,
      {
        externalId,
        email,
        language: 'en',
        username,
        verificationStatus: 'approved',
        provider: 'email',
      },
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    )

    console.log('Successfully created user in database')
  } catch (error) {
    console.log('Unable to create Firebase user in database', error)
    process.exitCode = 1
  }
}

async function setupUser({ username, email }) {
  try {
    const { user: createdUser } = await createUserWithEmailAndPassword(
      auth,
      email,
      process.env.password
    )
    const { uid } = createdUser

    // We need to sign the user in to get a token, which we use to create the user in the DB
    const { user: signedInUser } = await signInWithEmailAndPassword(
      auth,
      email,
      process.env.password
    )

    admin.auth().updateUser(uid, { emailVerified: true })

    const token = await signedInUser.getIdToken()

    await createUserInDB(uid, username, email, token)
    await signOut(auth)
  } catch (error) {
    console.log(`Error setting up user ${username}`, error)
    process.exitCode = 1
  }
}

const mockUsers = [
  {
    username: process.env.username,
    email: process.env.email,
  },
  {
    username: `${process.env.username}2`,
    email: process.env.email.replace('@', '+2@'),
  },
]

for (const user of mockUsers) {
  setupUser(user)
}
