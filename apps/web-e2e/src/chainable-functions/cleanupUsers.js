const admin = require('firebase-admin')
const axios = require('axios')

if (admin.apps.length === 0) {
  admin.initializeApp({
    credential: admin.credential.cert(
      JSON.parse(process.env.firebaseServiceAccount)
    ),
  })
}

if (!process.env.email) console.error('no email provided')
if (!process.env.username) console.error('no username provided')

const usernames = [process.env.username, `${process.env.username}2`]

const deleteUserFromAPI = () => {
  return axios({
    method: 'delete',
    url: `${process.env.apiURL}/accounts/delete-test-account`,
    headers: {
      Authorization: `Bearer ${process.env.apiKey}`,
      'Content-Type': 'application/json',
    },
    data: { usernames },
  })
    .then((response) => {
      console.log('Successfully deleted user from database', response)
      process.exitCode = 0
    })
    .catch(function (error) {
      console.log('Unable to delete user from database', error)
      process.exitCode = 1
    })
}

admin
  .auth()
  .getUsers([
    { email: process.env.email },
    { email: process.env.email.replace('@', '+2@') },
  ])
  .then(function ({ users }) {
    admin
      .auth()
      .deleteUsers(users.map((user) => user.uid))
      .then(function () {
        console.log('Successfully deleted users from Firebase')

        return deleteUserFromAPI()
      })
      .catch(function (error) {
        console.log('Unable to delete user from Firebase', error.code)
        process.exitCode = 1
      })
  })
  .catch(function (error) {
    if (error.code === 'auth/user-not-found') {
      return deleteUserFromAPI()
    } else {
      console.log('Error fetching user data:', error)
      process.exitCode = 1
    }
  })
