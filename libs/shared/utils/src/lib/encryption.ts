import CryptoJS from 'crypto-js'
import { randomBytes } from 'node:crypto'

const SALT_BYTES = 16
const ENCODING = 'base64'

/**
 * Helper function to create a key and salt.
 *
 * secret -- the secret that would be configured on a per-app
 * basis (ie. it comes from the env vars)
 */
function createKey(salt: string | undefined, secret: string) {
  salt = salt || randomBytes(SALT_BYTES).toString(ENCODING)
  const key = CryptoJS.SHA256(salt + secret).toString(CryptoJS.enc.Base64)
  return {
    key,
    salt,
  }
}

/**
 * Encrypts a value
 *
 * Internally generates a new key and salt. The result is a byte array with the
 * salt and the encrypted value.
 */
export function encrypt(value: string, secret: string) {
  const { key, salt } = createKey(undefined, secret)
  const encrypted = CryptoJS.AES.encrypt(value, key).toString()
  const bytes = Buffer.concat([
    Buffer.from(salt, ENCODING),
    Buffer.from(encrypted, ENCODING),
  ])
  return bytes.toString(ENCODING)
}

/**
 * Decrypts a base64-encoded string.
 *
 * Internally extracts the salt from the base64-encoded string and uses it to recreate the key.
 *
 * May return a zero-length string if the decryption fails.
 */
export function decrypt(encryptedValue: string, secret: string) {
  try {
    const encryptedBytes = Buffer.from(encryptedValue, ENCODING)
    const salt = Buffer.from(encryptedBytes.slice(0, SALT_BYTES)).toString(
      ENCODING
    )
    const encrypted = Buffer.from(encryptedBytes.slice(SALT_BYTES)).toString(
      ENCODING
    )
    const { key } = createKey(salt, secret)
    return CryptoJS.AES.decrypt(encrypted, key).toString(CryptoJS.enc.Utf8)
  } catch {
    return ''
  }
}
