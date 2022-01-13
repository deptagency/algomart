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

if (!process.env.email) console.log('no email provided')

admin
  .auth()
  .getUserByEmail(process.env.email)
  .then(function (userRecord) {
    admin
      .auth()
      .deleteUser(userRecord.uid)
      .then(function () {
        console.log('Successfully deleted user from Firebase')
        return axios
          .delete(`${process.env.API_URL}/accounts/${userRecord.uid}`, {
            headers: { Authorization: `Bearer ${process.env.API_KEY}` },
          })
          .then((response) => {
            console.log('Successfully deleted user from database', response)
            process.exitCode = 0
          })
          .catch(function (error) {
            console.log('Unable to delete user from database', error)
            process.exitCode = 1
          })
      })
      .catch(function (error) {
        console.log('Unable to delete user from Firebase', error.code)
        process.exitCode = 1
      })
  })
  .catch(function (error) {
    if (error.code === 'auth/user-not-found') {
      process.exitCode = 0
    } else {
      console.log('Error fetching user data:', error)
      process.exitCode = 1
    }
  })
