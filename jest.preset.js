const nxPreset = require('@nrwl/jest/preset')

module.exports = {
  ...nxPreset,
  resolver: require.resolve('./jest.resolver.js'),
}
