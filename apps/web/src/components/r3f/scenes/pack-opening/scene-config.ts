import { AppConfig } from '@/config'

export const isDebug = AppConfig.debugThreeJS

export const sceneConfig = {
  bgParticleColor: '#3A77D2',
  bgParticleCount: { value: 1000, min: 0, max: 50_000, step: 50 },
  bgParticleSize: { value: 4, min: 0, max: 10, step: 0.1 },
  bgParticleSpread: { value: 100, min: 0, max: 400, step: 10 },
  envMapIntensity: { value: 0.5, min: 0, max: 5, step: 0.125 },
  lightIntensity: { value: 7.25, min: 0, max: 25, step: 0.25 },
  lightPositionX: { value: 0, min: -20, max: 20, step: 0.5 },
  lightPositionY: { value: 6.5, min: -20, max: 20, step: 0.5 },
  lightPositionZ: { value: 10, min: -50, max: 20, step: 0.5 },
  mouseIntensity: { value: 0, min: -1, max: 1, step: 0.001 },
  noise: { value: 0.25, min: 0, max: 1, step: 0.01 },
  orbitalDistanceMax: { value: 100, min: -1000, max: 1000, step: 5 },
  orbitalDistanceMin: { value: 100, min: -1000, max: 1000, step: 5 },
  packParticleColor: '#e100c1',
  packParticleCount: { value: 1000, min: 0, max: 50_000, step: 50 },
  packParticleSize: { value: 2, min: 0, max: 10, step: 0.1 },
  packParticleSpread: { value: 50, min: 0, max: 400, step: 10 },
  spotAngle: { value: 0.25, min: -5, max: 5, step: 0.1 },
  spotDistance: { value: 300, min: 50, max: 500, step: 1 },
  spotIntensity: { value: 1500, min: 0, max: 50_000, step: 100 },
  spotPositionX: { value: -20, min: -100, max: 100, step: 1 },
  spotPositionY: { value: -5, min: -100, max: 100, step: 1 },
  spotPositionZ: { value: 150, min: -200, max: 200, step: 1 },
  toneMappingExposure: { value: -2.25, min: -5, max: 5, step: 0.125 },
}
