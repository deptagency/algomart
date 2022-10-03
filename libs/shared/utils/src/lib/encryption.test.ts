import { decrypt, encrypt } from './encryption'

const secret = 'my-fake-secret'

test('encrypt/decrypt', () => {
  const encryptedValue = encrypt('some value', secret)
  const value = decrypt(encryptedValue, secret)
  expect(value).toBe('some value')
})

test('encrypt yields different value each time', () => {
  const encryptedValue1 = encrypt('some value', secret)
  const encryptedValue2 = encrypt('some value', secret)
  expect(encryptedValue1).not.toBe(encryptedValue2)
})
