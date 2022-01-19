import { decrypt, encrypt } from './encryption'

test('encrypt/decrypt', () => {
  const encryptedValue = encrypt('some value', '000000')
  const value = decrypt(encryptedValue, '000000')
  expect(value).toBe('some value')
})

test('encrypt yields different value each time', () => {
  const encryptedValue1 = encrypt('some value', '000000')
  const encryptedValue2 = encrypt('some value', '000000')
  expect(encryptedValue1).not.toBe(encryptedValue2)
})

test('decrypt fails if passphrase is incorrect', () => {
  const encryptedValue = encrypt('some value', '000000')
  const value = decrypt(encryptedValue, '000001')
  expect(value).toBe('')
})
