import { animated, config, useSpring } from '@react-spring/three'
import { useFrame } from '@react-three/fiber'
import { MutableRefObject, useMemo, useRef } from 'react'
import { BufferGeometry, Color, InstancedMesh, Material, Object3D } from 'three'

interface ParticlesProps {
  color?: string | Color
  count: number
  mouse: MutableRefObject<number[]>
  mouseIntensity?: number
  size?: number
  spread?: number
}

export default function Particles({
  color = '#fff',
  count,
  mouse,
  mouseIntensity = 0.002,
  size = 1,
  spread = 100,
}: ParticlesProps) {
  const mesh = useRef<InstancedMesh>()

  const particleIntro = useSpring({
    from: { opacity: 0 },
    to: { opacity: 1 },
    config: { ...config.molasses, duration: 500 },
  })

  const dummy = useMemo(() => new Object3D(), [])
  // Generate some random positions, speed factors and timings
  const particles = useMemo(() => {
    const halfSpread = -spread / 2
    const temporary = []
    for (let index = 0; index < count; index++) {
      temporary.push({
        timeBasis: Math.random() * 100,
        factor: 20 + Math.random() * 100,
        speed: 0.01 + Math.random() / 200,
        spreadX: halfSpread + Math.random() * spread,
        spreadY: halfSpread + Math.random() * spread,
        spreadZ: halfSpread + Math.random() * spread,
        mx: 0,
        my: 0,
      })
    }
    return temporary
  }, [count, spread])

  useFrame(() => {
    // Iterate over instances and apply positioning
    for (const [index, particle] of particles.entries()) {
      const { factor, speed, spreadX, spreadY, spreadZ } = particle
      let { mx, my } = particle
      const time = (particle.timeBasis += speed / 2)
      const offset = Math.cos(time) + Math.sin(time * 1) / 10
      const scale = (Math.cos(time) / 10) * size

      // Mouse behavior
      mx += (mouse.current[0] - mx) * mouseIntensity
      my += (mouse.current[1] * -1 - my) * mouseIntensity

      // Update the dummy instance
      dummy.position.set(
        (mx / 10) * offset +
          spreadX +
          Math.cos((time / 10) * factor) +
          (Math.sin(time * 1) * factor) / 10,
        (my / 10) * offset +
          spreadY +
          Math.cos((time / 10) * factor) +
          (Math.sin(time * 2) * factor) / 10,
        (my / 10) * offset +
          spreadZ +
          Math.cos((time / 10) * factor) +
          (Math.sin(time * 3) * factor) / 10
      )
      dummy.scale.set(scale, scale, scale)
      dummy.updateMatrix()

      // Apply the matrix to the instanced item
      if (mesh.current) {
        mesh.current.setMatrixAt(index, dummy.matrix)
      }
    }
    // Update mesh
    if (mesh.current) {
      mesh.current.instanceMatrix.needsUpdate = true
    }
  })

  return (
    <>
      <ambientLight intensity={0.5} />
      <instancedMesh
        ref={mesh}
        args={[new BufferGeometry(), new Material(), count]}
      >
        <sphereBufferGeometry attach="geometry" />
        <animated.meshStandardMaterial
          attach="material"
          color={color}
          transparent
          {...particleIntro}
        ></animated.meshStandardMaterial>
      </instancedMesh>
    </>
  )
}
