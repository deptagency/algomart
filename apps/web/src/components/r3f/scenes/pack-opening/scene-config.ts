export const isDebug = process.env.NEXT_PUBLIC_3JS_DEBUG === 'true'

export const sceneConfig = {
  envMapIntensity: { value: 0.5, min: 0, max: 5, step: 0.125 },
  ambientIntensity: { value: 0, min: 0, max: 5, step: 0.25 },
  lightIntensity: { value: 7.25, min: 0, max: 25, step: 0.25 },
  lightPositionX: { value: 2, min: -20, max: 20, step: 0.5 },
  lightPositionY: { value: 6.5, min: -20, max: 20, step: 0.5 },
  lightPositionZ: { value: 20, min: -50, max: 20, step: 0.5 },
  mouseIntensity: { value: 0.001, min: 0, max: 0.005, step: 0.001 },
  noise: { value: 0.04, min: 0, max: 1, step: 0.01 },
  particleColor: '#02fbc2',
  particleCount: { value: 1000, min: 0, max: 50_000, step: 50 },
  particleSize: { value: 0.75, min: 0, max: 10, step: 0.1 },
  particleSpread: { value: 100, min: 0, max: 400, step: 10 },
  orbitalDistanceMax: { value: 100, min: -1000, max: 1000, step: 5 },
  orbitalDistanceMin: { value: 100, min: -1000, max: 1000, step: 5 },
  toneMappingExposure: { value: 1, min: -5, max: 5, step: 0.125 },
}
