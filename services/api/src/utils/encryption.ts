import CryptoJS from 'crypto-js'
import { randomBytes } from 'node:crypto'

import { Configuration } from '@/configuration'

const SALT_BYTES = 16
const ENCODING = 'base64'

/**
 * Helper function to create a key and salt.
 */
function createKey(passphrase: string, salt?: string) {
  salt = salt || randomBytes(SALT_BYTES).toString(ENCODING)
  const key = CryptoJS.SHA256(
    salt + passphrase + Configuration.secret
  ).toString(CryptoJS.enc.Base64)
  return {
    key,
    salt,
  }
}

/**
 * Encrypts a value using a passphrase.
 *
 * Internally generates a new key and salt. The result is a byte array with the
 * salt and the encrypted value.
 */
export function encrypt(value: string, passphrase: string) {
  const { key, salt } = createKey(passphrase)
  const encrypted = CryptoJS.AES.encrypt(value, key).toString()
  const bytes = Buffer.concat([
    Buffer.from(salt, ENCODING),
    Buffer.from(encrypted, ENCODING),
  ])
  return bytes.toString(ENCODING)
}

/**
 * Decrypts a base64-encoded string using a passphrase.
 *
 * Internally extracts the salt from the base64-encoded string and uses it to recreate the key.
 *
 * May return a zero-length string if the decryption fails.
 */
export function decrypt(encryptedValue: string, passphrase: string) {
  try {
    const encryptedBytes = Buffer.from(encryptedValue, ENCODING)
    const salt = Buffer.from(encryptedBytes.slice(0, SALT_BYTES)).toString(
      ENCODING
    )
    const encrypted = Buffer.from(encryptedBytes.slice(SALT_BYTES)).toString(
      ENCODING
    )
    const { key } = createKey(passphrase, salt)
    return CryptoJS.AES.decrypt(encrypted, key).toString(CryptoJS.enc.Utf8)
  } catch {
    return ''
  }
}
