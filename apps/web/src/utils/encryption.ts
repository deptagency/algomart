import { PublicKey } from '@algomart/schemas'
import { createMessage, encrypt as pgpEncrypt, readKey } from 'openpgp'

export async function encryptCardDetails(
  data: Record<string, string>,
  details: PublicKey
): Promise<string> {
  const { publicKey } = details
  const decodedPublicKey = atob(publicKey)

  const message = await createMessage({ text: JSON.stringify(data) })
  const publicKeys = await readKey({ armoredKey: decodedPublicKey })
  const encrypted = await pgpEncrypt({
    message,
    encryptionKeys: publicKeys,
  })

  return btoa(String(encrypted))
}
