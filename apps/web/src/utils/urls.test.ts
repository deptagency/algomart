import { isRootPathMatch } from './urls'

describe('isRootPathMatch', () => {
  test('is match', () => {
    expect(
      isRootPathMatch('/collections', '/collections/some-collection')
    ).toBeTruthy()
  })

  test('is not match', () => {
    expect(isRootPathMatch('/collections', '/sets/some-set')).toBeFalsy()
  })
})
