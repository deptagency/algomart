import { getPrefixPath, isSubPath } from './urls'

describe('isSubPath', () => {
  test('is match', () => {
    expect(isSubPath('/collections/some-collection', '/collections')).toBe(true)
    expect(isSubPath('/my/profile/credits', '/my/profile')).toBe(true)
    expect(isSubPath('/my/profile/credits?foo=bar', '/my/profile')).toBe(true)
    expect(isSubPath('/my/profile/credits', '/my/profile?foo=bar')).toBe(true)
    expect(isSubPath('/something', '/something')).toBe(true)
    expect(isSubPath('/', '/')).toBe(true)
  })

  test('is not match', () => {
    expect(isSubPath('/sets/some-set', '/collections')).toBe(false)
    expect(isSubPath('/my/collections', '/my/profile')).toBe(false)
    expect(isSubPath('/something', '/some')).toBe(false)
    expect(isSubPath('/anything', '/')).toBe(false)
  })

  test('ignores specified matches', () => {
    expect(isSubPath('/my/wallet', '/my')).toBe(true)
    expect(isSubPath('/my/wallet', '/my', ['wallet'])).toBe(false)
  })
})

describe('getPrefixPath', () => {
  it('returns the prefix', () => {
    expect(getPrefixPath('/my/collectibles')).toBe('/my')
    expect(getPrefixPath('/my/profile/credits')).toBe('/my')
    expect(getPrefixPath('/drops/pack-1')).toBe('/drops')
    expect(getPrefixPath('/marketplace/asset2')).toBe('/marketplace')
    expect(getPrefixPath('/')).toBe('/')
    expect(getPrefixPath()).toBe('/')
  })
})
