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
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import {
  Bloom,
  EffectComposer,
  Noise,
  Vignette,
} from '@react-three/postprocessing'
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
  Object3D,
  SpotLight,
  sRGBEncoding,
  Vector2,
  Vector3,
} from 'three'

import CanvasButton from './sections/canvas-button'
import CanvasLoader from './sections/canvas-loader'
import PackModel from './sections/pack-model'
import Particles from './sections/particles'
import { isDebug, sceneConfig } from './scene-config'

import { usePackOpening } from '@/contexts/pack-opening-context'

interface PackOpeningProps {
  actionText: string
  collectablesText: string
  mouse: MutableRefObject<[number, number]>
  packPreview: string
  packTitle: string
  setSceneComplete(isComplete: boolean): void
  setSceneMounted(isMounted: boolean): void
}

const PackOpening = memo(function Scene({
  actionText,
  // collectablesText,
  mouse,
  packPreview,
  // packTitle,
  setSceneComplete,
  setSceneMounted,
}: PackOpeningProps) {
  // Global configuration and debug parms
  const controls = useControls(sceneConfig)

  // Interactions
  const [introComplete, setIntroComplete] = useState<boolean>(false)
  const [hovered, setHover] = useState<boolean>(false)
  const [opened, setOpened] = useState<boolean>(false)

  // Animations
  const particleIntro = useSpring({
    config: config.molasses,
    delay: 250,
    from: { 'position-y': -80, 'rotation-y': Math.PI * -1 },
    to: { 'position-y': 5, 'rotation-y': Math.PI * -2 },
  })
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
  })
  const scale = useSpring({
    config: config.slow,
    scale: (opened || hovered
      ? [1.25, 1.25, 1.25]
      : [1, 1, 1]) as unknown as Vector3,
  })
  const takeOff = useSpring({
    config: config.gentle,
    delay: 2000,
    ...(opened && {
      from: { 'position-y': 5 },
      to: { 'position-y': 80 },
    }),
  })

  // Environment
  const environmentMap = useCubeTexture(
    [
      'dark-texture.jpg',
      'dark-texture.jpg',
      'dark-texture.jpg',
      'dark-texture.jpg',
      'dark-texture.jpg',
      'dark-texture.jpg',
    ],
    { path: '/images/textures/' }
  )

  //Pack Cover
  const coverImage = useTexture(
    `/_next/image?url=${encodeURI(packPreview)}&w=1080&q=75`
  )

  // Model
  const texture = useTexture('/images/textures/dark-texture.jpg')
  texture.generateMipmaps = true
  texture.minFilter = NearestFilter
  texture.magFilter = NearestFilter
  texture.repeat = new Vector2(10, 10)
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
      child.material.metalness = 0.9
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
    directionalLight.current.shadow.camera.top = -175
    directionalLight.current.shadow.camera.bottom = 175
    directionalLight.current.shadow.camera.left = -175
    directionalLight.current.shadow.camera.right = 175
    directionalLight.current.shadow.normalBias = 0.25
  }
  const movingLight1 = useRef<DirectionalLight>()
  const movingLight2 = useRef<DirectionalLight>()
  const movingLight3 = useRef<DirectionalLight>()

  const spotLight1 = useRef<SpotLight>()
  const spotLight2 = useRef<SpotLight>()
  const spotLightTarget = useRef<Object3D<Event>>()

  useFrame(({ clock }) => {
    if (movingLight1.current) {
      movingLight1.current.position.x = Math.cos(clock.getElapsedTime()) * 3
      movingLight1.current.position.y = Math.sin(clock.getElapsedTime()) * 3
    }
    if (movingLight2.current) {
      movingLight2.current.position.x = -Math.cos(clock.getElapsedTime()) * 4
      movingLight2.current.position.y =
        -Math.sin(clock.getElapsedTime() * 2) * 5
    }
    if (movingLight3.current) {
      movingLight3.current.position.x = -Math.sin(clock.getElapsedTime()) / 5
      movingLight3.current.position.y = -Math.cos(clock.getElapsedTime()) / 5
    }

    if (spotLight1.current) {
      spotLight1.current.position.y = Math.sin(clock.getElapsedTime()) * 5
      spotLight1.current.position.z = Math.sin(clock.getElapsedTime()) * 5
    }
    if (spotLight2.current) {
      spotLight2.current.position.x = -180
      spotLight2.current.position.y = -Math.cos(clock.getElapsedTime()) * -15
      spotLight2.current.position.z =
        -Math.cos(clock.getElapsedTime()) * 15 + 180
    }
  })

  return (
    <>
      {/* Mouse controls */}
      <OrbitControls
        enableDamping
        autoRotate
        autoRotateSpeed={0.25}
        // These constrain zoom in/out
        maxDistance={controls.orbitalDistanceMax}
        minDistance={controls.orbitalDistanceMin}
        // These constrain rotation
        maxAzimuthAngle={Math.PI * 0.1}
        minAzimuthAngle={-Math.PI * 0.1}
        maxPolarAngle={Math.PI * 0.6}
        minPolarAngle={Math.PI * 0.4}
      />

      {/* Background elements */}
      <Plane position={[0, 0, -20]} scale={[250, 250, 250]}>
        <meshStandardMaterial
          map={coverImage}
          opacity={0.005}
          transparent
          metalness={0.45}
          roughness={0}
        />
      </Plane>
      <Plane position={[0, 0, -25]} scale={[500, 200, 250]}>
        <meshStandardMaterial
          color={'#666'}
          opacity={1}
          transparent
          metalness={0.5}
          roughness={0}
        />
      </Plane>

      {/* Lights */}
      <spotLight
        angle={controls.spotAngle}
        color="#ff0000"
        distance={controls.spotDistance}
        intensity={controls.spotIntensity}
        target={spotLightTarget.current}
        penumbra={0.1}
        position-x={controls.spotPositionX}
        position-y={controls.spotPositionY}
        position-z={controls.spotPositionZ}
        ref={spotLight1}
      />
      <spotLight
        angle={controls.spotAngle}
        color="#ff0000"
        distance={controls.spotDistance}
        intensity={controls.spotIntensity}
        target={spotLightTarget.current}
        penumbra={0.1}
        position-x={controls.spotPositionX}
        position-y={controls.spotPositionY}
        position-z={controls.spotPositionZ}
        ref={spotLight2}
      />

      <directionalLight
        intensity={controls.lightIntensity}
        position-x={controls.lightPositionX}
        position-y={controls.lightPositionY}
        position-z={controls.lightPositionZ}
        ref={directionalLight}
        shadow-mapSize-height={512}
        shadow-mapSize-width={512}
      />
      <directionalLight
        args={['#ff0000', 1]}
        ref={movingLight1}
        position-z={10}
      />
      <directionalLight
        args={['#ff0000', 1]}
        ref={movingLight2}
        position-z={20}
      />
      <directionalLight
        args={['#ff0000', 1]}
        ref={movingLight3}
        position-z={30}
      />

      {/* Background Particles */}
      {opened && (
        <Particles
          color={controls.bgParticleColor}
          count={controls.bgParticleCount}
          mouse={mouse}
          mouseIntensity={controls.mouseIntensity}
          size={controls.bgParticleSize}
          spread={controls.bgParticleSpread}
        />
      )}

      {/* Pack particles */}
      <animated.mesh {...particleIntro}>
        <Particles
          color={controls.packParticleColor}
          count={controls.packParticleCount}
          mouse={mouse}
          mouseIntensity={controls.mouseIntensity}
          size={controls.packParticleSize}
          spread={controls.packParticleSpread}
        />
      </animated.mesh>

      <animated.mesh
        {...positionY}
        {...positionZ}
        {...rotationX}
        {...rotationY}
        {...rotationZ}
        {...scale}
        {...takeOff}
      >
        {/* Card Pack Model */}
        <group
          dispose={null}
          position-y={-25}
          rotation={[0, Math.PI * 0.5, 0]}
          scale={[0.000_07, 0.000_07, 0.000_07]}
        >
          <PackModel position={[0, Math.PI, 0]} scale={[0.6, 0.35, 0.68]} />
        </group>

        {/* Cover image  */}
        <Plane
          // Note, this prop represents x:y scale of pack image
          args={[48, 46]}
          onPointerOver={() => setHover(true)}
          onPointerOut={() => setHover(false)}
          position-y={-0.25}
          position-z={3.5}
          scale={[1, coverImage.image.height / coverImage.image.width, 1]}
        >
          <meshStandardMaterial
            attach="material"
            color={'white'}
            envMap={environmentMap}
            map={coverImage}
            metalness={0.9}
            roughness={0}
            transparent
          />
        </Plane>

        {/* Label Text (leave for now) */}
        {/* <group position-y={-12} position-z={-0.5}>
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
        </group> */}
      </animated.mesh>

      {/* Open pack button */}
      <Html center position-y={-35}>
        <CanvasButton
          data-e2e="pack-opening-action"
          onClick={() => {
            setOpened(!opened)
            setSceneComplete(true)
            // Allow time to fade out before unmounting
            setTimeout(() => {
              setSceneMounted(false)
            }, 3500)
          }}
          visible={introComplete && !opened}
        >
          {actionText}
        </CanvasButton>
      </Html>

      {/* Post-processing */}
      <EffectComposer>
        <Bloom
          luminanceThreshold={0}
          luminanceSmoothing={1}
          opacity={0.25}
          radius={1}
        />
        <Noise opacity={controls.noise} />
        <Vignette eskil={false} offset={0.1} darkness={1.1} />
      </EffectComposer>
    </>
  )
})

export default function R3FCanvas() {
  const { packToOpen, setSceneComplete, setSceneMounted } = usePackOpening()
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
      <Canvas dpr={[1, 2]} gl={{ preserveDrawingBuffer: true }} shadows>
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

          <Html center>{!packToOpen && <CanvasLoader />}</Html>
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
              setSceneMounted={setSceneMounted}
            />
          )}
        </Suspense>
      </Canvas>
    </>
  )
}
