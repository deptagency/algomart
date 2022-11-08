const nxResolver = require('@nrwl/jest/plugins/resolver')

/**
 * Override for the Nx Jest resolver to ensure we import the correct uuid and firebase packages.
 * @see https://jestjs.io/docs/upgrading-to-jest28#packagejson-exports
 * @param {string} path
 * @param {any} options
 * @returns Nx Jest resolver with custom package filter
 */
module.exports = (path, options) => {
  return nxResolver(path, {
    ...options,
    packageFilter(pkg) {
      // Fix: uuid is resolving to its esm build
      if (pkg.name === 'uuid') {
        delete pkg['exports']
        delete pkg['module']
      }
      // Fix: firebase is resolving to its esm builds
      if (
        pkg.name === 'firebase' ||
        pkg.name === 'firebase-admin' ||
        pkg.name.startsWith('@firebase/')
      ) {
        delete pkg['exports']
        delete pkg['module']
      }
      // Fix: msgpackr is resolving to its esm build
      if (pkg.name === 'msgpackr') {
        delete pkg['exports']
        delete pkg['module']
      }
      return pkg
    },
  })
}
