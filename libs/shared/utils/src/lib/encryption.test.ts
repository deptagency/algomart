import { decrypt, encrypt } from './encryption'

const secret = 'my-fake-secret'

test('encrypt/decrypt', () => {
  const encryptedValue = encrypt('some value', '000000', secret)
  const value = decrypt(encryptedValue, '000000', secret)
  expect(value).toBe('some value')
})

test('encrypt yields different value each time', () => {
  const encryptedValue1 = encrypt('some value', '000000', secret)
  const encryptedValue2 = encrypt('some value', '000000', secret)
  expect(encryptedValue1).not.toBe(encryptedValue2)
})

test('decrypt fails if passphrase is incorrect', () => {
  const encryptedValue = encrypt('some value', '000000', secret)
  const value = decrypt(encryptedValue, '000001', secret)
  expect(value).toBe('')
})
