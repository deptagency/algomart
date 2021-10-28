import { PublicKey } from '@algomart/schemas'
import CryptoJS from 'crypto-js'
import { createMessage, encrypt as encryption, readKey } from 'openpgp'

export function encrypt(value: string, passphrase: string) {
  return CryptoJS.AES.encrypt(value, passphrase).toString()
}

export function decrypt(encryptedValue: string, passphrase: string) {
  return CryptoJS.AES.decrypt(encryptedValue, passphrase).toString(
    CryptoJS.enc.Utf8
  )
}

export async function encryptCardDetails(
  data: Record<string, string>,
  details: PublicKey
): Promise<string> {
  const { publicKey } = details
  const decodedPublicKey = atob(publicKey)

  const message = await createMessage({ text: JSON.stringify(data) })
  const publicKeys = await readKey({ armoredKey: decodedPublicKey })
  const encrypted = await encryption({
    message,
    encryptionKeys: publicKeys,
  })

  return btoa(encrypted)
}
