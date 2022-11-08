const admin = require('firebase-admin')

if (admin.apps.length === 0) {
  admin.initializeApp({
    credential: admin.credential.cert(
      JSON.parse(process.env.firebaseServiceAccount)
    ),
  })
}

if (!process.env.email) console.error('no email provided')

admin
  .auth()
  .getUserByEmail(process.env.email)
  .then(function (userRecord) {
    admin
      .auth()
      .updateUser(userRecord.uid, { emailVerified: true })
      .then(function () {
        console.log('Successfully verified user email')
      })
      .catch(function (error) {
        console.log('Unable to verify user email', error.code)
        process.exitCode = 1
      })
  })
  .catch(function (error) {
    console.log('Error fetching user data:', error)
    process.exitCode = 1
  })
