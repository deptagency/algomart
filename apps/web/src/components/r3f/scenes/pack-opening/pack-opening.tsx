import { animated, config, useSpring } from '@react-spring/three'
import {
  Html,
  OrbitControls,
  PerspectiveCamera,
  Plane,
  Stats,
  useCubeTexture,
  useGLTF,
  useTexture,
} from '@react-three/drei'
import { Canvas, useThree } from '@react-three/fiber'
import { Bloom, EffectComposer, Noise } from '@react-three/postprocessing'
import { Leva, useControls } from 'leva'
import useTranslation from 'next-translate/useTranslation'
import {
  memo,
  MutableRefObject,
  Suspense,
  useEffect,
  useRef,
  useState,
} from 'react'
import {
  ACESFilmicToneMapping,
  DirectionalLight,
  Mesh,
  MeshStandardMaterial,
  NearestFilter,
  sRGBEncoding,
  Vector3,
} from 'three'

import CanvasButton from './sections/canvas-button'
import CanvasLoader from './sections/canvas-loader'
import Particles from './sections/particles'
import TextBox from './sections/text-box'
import { isDebug, sceneConfig } from './scene-config'

import { usePackOpening } from '@/contexts/pack-opening-context'

interface PackOpeningProps {
  actionText: string
  collectablesText: string
  mouse: MutableRefObject<[number, number]>
  packPreview: string
  packTitle: string
  setSceneComplete(isComplete: boolean): void
}

const PackOpening = memo(function Scene({
  actionText,
  collectablesText,
  mouse,
  packPreview,
  packTitle,
  setSceneComplete,
}: PackOpeningProps) {
  // Global configuration and debug parms
  const controls = useControls(sceneConfig)

  // Interactions
  const [introComplete, setIntroComplete] = useState<boolean>(false)
  const [hovered, setHover] = useState<boolean>(false)
  const [opened, setOpened] = useState<boolean>(false)

  // Pack Animations
  const positionY = useSpring({
    config: config.molasses,
    delay: 500,
    from: { 'position-y': -80 },
    to: { 'position-y': 5 },
    onStart: () => setIntroComplete(true),
  })
  const positionZ = useSpring({
    config: config.molasses,
    'position-z': opened ? 5 : 0,
  })
  const rotationX = useSpring({
    config: config.molasses,
    'rotation-x': opened ? -Math.PI * 0.05 : 0,
  })
  const rotationY = useSpring({
    config: config.molasses,
    'rotation-y':
      introComplete && !opened ? Math.PI * 2 : opened ? Math.PI * 4.15 : 0,
  })
  const rotationZ = useSpring({
    config: config.molasses,
    'rotation-z': opened ? -Math.PI * 0.05 : 0,
  })
  const scale = useSpring({
    config: config.slow,
    scale: (opened || hovered
      ? [1.25, 1.25, 1.25]
      : [1, 1, 1]) as unknown as Vector3,
  })

  // Environment
  const environmentMap = useCubeTexture(
    [
      'pack-texture.jpg',
      'pack-texture.jpg',
      'pack-texture.jpg',
      'pack-texture.jpg',
      'pack-texture.jpg',
      'pack-texture.jpg',
    ],
    { path: '/images/textures/' }
  )

  //Pack Cover
  const coverImage = useTexture(packPreview)

  // Model
  const texture = useTexture('/images/textures/pack-texture.jpg')
  texture.generateMipmaps = true
  texture.minFilter = NearestFilter
  texture.magFilter = NearestFilter
  const gltf = useGLTF('/threejs/models/pack-model.glb', true)
  gltf.scene.traverse((child) => {
    // Applies texture properties to appropriate scene objects
    if (
      child instanceof Mesh &&
      child.material instanceof MeshStandardMaterial
    ) {
      child.material.envMap = environmentMap
      child.material.envMapIntensity = controls.envMapIntensity
      child.material.map = texture
      child.material.metalness = 1
      child.material.roughness = 0
    }
  })

  // Renderer/Scene Configurations
  const { gl } = useThree()
  gl.outputEncoding = sRGBEncoding
  gl.physicallyCorrectLights = true
  gl.toneMapping = ACESFilmicToneMapping
  gl.toneMappingExposure = controls.toneMappingExposure
  gl.setClearColor('#fff', 0)

  // Lights
  const directionalLight = useRef<DirectionalLight>()
  if (directionalLight.current) {
    directionalLight.current.shadow.camera.far = 125
    directionalLight.current.shadow.camera.near = -50
    directionalLight.current.shadow.camera.top = -75
    directionalLight.current.shadow.camera.bottom = 75
    directionalLight.current.shadow.camera.left = -75
    directionalLight.current.shadow.camera.right = 75
    directionalLight.current.shadow.normalBias = 0.25
  }

  return (
    <>
      {/* Mouse controls */}
      <OrbitControls
        enableDamping
        // These constrain zoom in/out
        maxDistance={controls.orbitalDistanceMax}
        minDistance={controls.orbitalDistanceMin}
        // These constrain rotation
        maxAzimuthAngle={Math.PI * 0.4}
        minAzimuthAngle={-Math.PI * 0.4}
        maxPolarAngle={Math.PI * 0.8}
        minPolarAngle={Math.PI * 0.2}
      />

      {/* Lights */}
      <ambientLight intensity={controls.ambientIntensity} />
      <directionalLight
        intensity={controls.lightIntensity}
        position-x={controls.lightPositionX}
        position-y={controls.lightPositionY}
        position-z={controls.lightPositionZ}
        ref={directionalLight}
      />

      {/* Background Particles */}
      {opened && (
        <Particles
          color={controls.particleColor}
          count={controls.particleCount}
          mouse={mouse}
          mouseIntensity={controls.mouseIntensity}
          size={controls.particleSize}
          spread={controls.particleSpread}
        />
      )}

      <animated.mesh
        {...positionY}
        {...positionZ}
        {...rotationX}
        {...rotationY}
        {...rotationZ}
        {...scale}
      >
        {/* Card Pack Model */}
        <group
          position-y={-30}
          rotation={[0, Math.PI * 0.5, 0]}
          scale={[0.000_03, 0.000_03, 0.000_03]}
        >
          <primitive
            object={gltf.scene.children[0]}
            position={[0, Math.PI, 0]}
          />
        </group>

        {/* Cover image  */}
        <Plane
          args={[22, 22]}
          onPointerOver={() => setHover(true)}
          onPointerOut={() => setHover(false)}
          position-y={8}
          position-z={1.9}
          scale={[1, coverImage.image.height / coverImage.image.width, 1]}
        >
          <meshStandardMaterial
            attach="material"
            color={'white'}
            envMap={environmentMap}
            map={coverImage}
            metalness={1}
            roughness={0}
            transparent
          />
        </Plane>

        {/* Label Text */}
        <group position-y={-12}>
          <TextBox
            boxDimensions={[22, 5, 1]}
            envMap={environmentMap}
            envMapIntensity={controls.envMapIntensity}
            groupPositionX={0}
            groupPositionY={0}
            text={
              packTitle.length < 14 ? packTitle : packTitle.slice(0, 14) + '...'
            }
            textDimensions={[25, 25, 25]}
          />
          <TextBox
            boxDimensions={[22, 3, 1]}
            envMap={environmentMap}
            envMapIntensity={controls.envMapIntensity}
            groupPositionX={0}
            groupPositionY={-4.1}
            text={collectablesText}
            textDimensions={[12, 12, 10]}
          />
        </group>
      </animated.mesh>

      {/* Open pack button */}
      <Html center position-y={-35}>
        <CanvasButton
          onClick={() => {
            setOpened(!opened)
            setSceneComplete(true)
          }}
          visible={introComplete && !opened}
        >
          {actionText}
        </CanvasButton>
      </Html>

      {/* Post-processing */}
      <EffectComposer>
        <Bloom luminanceThreshold={0} luminanceSmoothing={4.5} />
        <Noise opacity={controls.noise} />
      </EffectComposer>
    </>
  )
})

export default function R3FCanvas() {
  const { packToOpen, setSceneComplete } = usePackOpening()
  const { t } = useTranslation()

  // Mouse interactions
  const mouse = useRef<[number, number]>([0, 0])
  const handleMouseMove = ({ clientX: x, clientY: y }: MouseEvent) => {
    mouse.current = [x - window.innerWidth / 2, y - window.innerHeight / 2]
  }
  useEffect(() => {
    window.addEventListener('mousemove', handleMouseMove)
    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
    }
  }, [])

  return (
    <>
      <Leva collapsed hidden={!isDebug} oneLineLabels />
      {isDebug && <Stats />}
      <Canvas>
        <PerspectiveCamera makeDefault position={[0, 0, 100]} />
        <Suspense
          fallback={
            <Html center>
              <CanvasLoader />
            </Html>
          }
        >
          {/**
           * Notes
           * 1. to use R3F Hooks, the components must be nested within a <Canvas/> element
           * 2. useContext cannot be accessed from inside a dynamically imported canvas, so it must be drilled
           * 3. repeating the loader here allows for a graceful transition when the <Suspense/> resolves
           */}

          <Html center>
            <CanvasLoader />
          </Html>
          {packToOpen && (
            <PackOpening
              actionText={t('common:actions.Open Pack')}
              collectablesText={`${packToOpen.collectibles.length} ${t(
                'collection:viewer.Collectible',
                { count: packToOpen.collectibles.length }
              )}`}
              mouse={mouse}
              packPreview={packToOpen.image}
              packTitle={packToOpen.title}
              setSceneComplete={setSceneComplete}
            />
          )}
        </Suspense>
      </Canvas>
    </>
  )
}
