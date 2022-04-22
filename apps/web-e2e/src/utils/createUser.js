const admin = require('firebase-admin')
const axios = require('axios')

if (admin.apps.length === 0) {
  const firebaseServiceAccount = JSON.parse(
    process.env.FIREBASE_SERVICE_ACCOUNT || {}
  )
  admin.initializeApp({
    credential: admin.credential.cert(firebaseServiceAccount),
  })
}

if (!process.env.email) console.error('no email provided')
if (!process.env.password) console.error('no password provided')
if (!process.env.passphrase) console.error('no passphrase provided')
if (!process.env.username) console.error('no username provided')

const createUserInApi = (uid) => {
  return axios
    .post(
      `${process.env.API_URL}/accounts`,
      {
        externalId: uid,
        email: process.env.email,
        language: 'en-US',
        currency: 'USD',
        passphrase: process.env.passphrase,
        username: process.env.username,
      },
      {
        headers: { Authorization: `Bearer ${process.env.API_KEY}` },
      }
    )
    .then((response) => {
      console.log('Successfully created user in database', response)
      process.exitCode = 0
    })
    .catch((error) => {
      console.log('Unable to create Firebase user in database', {
        error: error.message,
        response: error.response?.data?.message,
      })
      process.exitCode = 1
    })
}

admin
  .auth()
  .getUserByEmail(process.env.email)
  .then(function (userRecord) {
    // Confirm the user is also in the databse
    return axios
      .get(`${process.env.API_URL}/accounts/${userRecord.uid}`, {
        headers: { Authorization: `Bearer ${process.env.API_KEY}` },
      })
      .then((response) => {
        console.log('User was already in Firebase and database', response)
        process.exitCode = 0
      })
      .catch(() => {
        // Create existing Firebase user in database
        return createUserInApi(userRecord.uid)
      })
  })
  .catch(function (error) {
    // Create user if does not exist
    if (error.code === 'auth/user-not-found') {
      admin
        .auth()
        .createUser({
          disabled: false,
          displayName: process.env.displayName,
          email: process.env.email,
          emailVerified: true,
          password: process.env.password,
        })
        .then((response) => {
          console.log('Successfully created user in Firebase', response)
          // Create new Firebase user in database
          return createUserInApi(response.uid)
        })
        .catch((error) => {
          console.log('Error fetching user data:', error)
          process.exitCode = 1
        })
    } else {
      console.log('Error fetching user data:', error)
      process.exitCode = 1
    }
  })
