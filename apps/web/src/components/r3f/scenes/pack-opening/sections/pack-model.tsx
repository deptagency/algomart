//@ts-nocheck // Nodes and materials exist on useGLTF but the package isn't well-typed
import { useGLTF } from '@react-three/drei'
import React, { useRef } from 'react'

export default function PackModel({ ...props }) {
  const group = useRef()

  const { nodes, materials } = useGLTF('/threejs/models/pack-model.glb')
  return (
    <group ref={group} {...props} dispose={null}>
      <group position={[-50_000, 1_950_000, -490_000]} rotation={[0, 0, -0.03]}>
        <mesh geometry={nodes.Cube1_0.geometry} material={materials.Mat} />
        <mesh
          geometry={nodes.Cube1_1.geometry}
          material={materials.Mat}
          position={[0, 0, 20_000]}
        />
        <mesh
          geometry={nodes.Cube1_2.geometry}
          material={materials.Mat}
          position={[0, 0, 40_000]}
        />
        <mesh
          geometry={nodes.Cube1_3.geometry}
          material={materials.Mat}
          position={[0, 0, 60_000]}
        />
        <mesh
          geometry={nodes.Cube1_4.geometry}
          material={materials.Mat}
          position={[0, 0, 80_000]}
        />
        <mesh
          geometry={nodes.Cube1_5.geometry}
          material={materials.Mat}
          position={[0, 0, 100_000]}
        />
        <mesh
          geometry={nodes.Cube1_6.geometry}
          material={materials.Mat}
          position={[0, 0, 120_000]}
        />
        <mesh
          geometry={nodes.Cube1_7.geometry}
          material={materials.Mat}
          position={[0, 0, 140_000]}
        />
        <mesh
          geometry={nodes.Cube1_8.geometry}
          material={materials.Mat}
          position={[0, 0, 160_000]}
        />
        <mesh
          geometry={nodes.Cube1_9.geometry}
          material={materials.Mat}
          position={[0, 0, 180_000]}
        />
        <mesh
          geometry={nodes.Cube1_10.geometry}
          material={materials.Mat}
          position={[0, 0, 200_000]}
        />
        <mesh
          geometry={nodes.Cube1_11.geometry}
          material={materials.Mat}
          position={[0, 0, 220_000]}
        />
        <mesh
          geometry={nodes.Cube1_12.geometry}
          material={materials.Mat}
          position={[0, 0, 240_000]}
        />
        <mesh
          geometry={nodes.Cube1_13.geometry}
          material={materials.Mat}
          position={[0, 0, 260_000]}
        />
        <mesh
          geometry={nodes.Cube1_14.geometry}
          material={materials.Mat}
          position={[0, 0, 280_000]}
        />
        <mesh
          geometry={nodes.Cube1_15.geometry}
          material={materials.Mat}
          position={[0, 0, 300_000]}
        />
        <mesh
          geometry={nodes.Cube1_16.geometry}
          material={materials.Mat}
          position={[0, 0, 320_000]}
        />
        <mesh
          geometry={nodes.Cube1_17.geometry}
          material={materials.Mat}
          position={[0, 0, 340_000]}
        />
        <mesh
          geometry={nodes.Cube1_18.geometry}
          material={materials.Mat}
          position={[0, 0, 360_000]}
        />
        <mesh
          geometry={nodes.Cube1_19.geometry}
          material={materials.Mat}
          position={[0, 0, 380_000]}
        />
        <mesh
          geometry={nodes.Cube1_20.geometry}
          material={materials.Mat}
          position={[0, 0, 400_000]}
        />
        <mesh
          geometry={nodes.Cube1_21.geometry}
          material={materials.Mat}
          position={[0, 0, 420_000]}
        />
        <mesh
          geometry={nodes.Cube1_22.geometry}
          material={materials.Mat}
          position={[0, 0, 440_000]}
        />
        <mesh
          geometry={nodes.Cube1_23.geometry}
          material={materials.Mat}
          position={[0, 0, 460_000]}
        />
        <mesh
          geometry={nodes.Cube1_24.geometry}
          material={materials.Mat}
          position={[0, 0, 480_000]}
        />
        <mesh
          geometry={nodes.Cube1_25.geometry}
          material={materials.Mat}
          position={[0, 0, 500_000]}
        />
        <mesh
          geometry={nodes.Cube1_26.geometry}
          material={materials.Mat}
          position={[0, 0, 520_000]}
        />
        <mesh
          geometry={nodes.Cube1_27.geometry}
          material={materials.Mat}
          position={[0, 0, 540_000]}
        />
        <mesh
          geometry={nodes.Cube1_28.geometry}
          material={materials.Mat}
          position={[0, 0, 560_000]}
        />
        <mesh
          geometry={nodes.Cube1_29.geometry}
          material={materials.Mat}
          position={[0, 0, 580_000]}
        />
        <mesh
          geometry={nodes.Cube1_30.geometry}
          material={materials.Mat}
          position={[0, 0, 600_000]}
        />
        <mesh
          geometry={nodes.Cube1_31.geometry}
          material={materials.Mat}
          position={[0, 0, 620_000]}
        />
        <mesh
          geometry={nodes.Cube1_32.geometry}
          material={materials.Mat}
          position={[0, 0, 640_000]}
        />
        <mesh
          geometry={nodes.Cube1_33.geometry}
          material={materials.Mat}
          position={[0, 0, 660_000]}
        />
        <mesh
          geometry={nodes.Cube1_34.geometry}
          material={materials.Mat}
          position={[0, 0, 680_000]}
        />
        <mesh
          geometry={nodes.Cube1_35.geometry}
          material={materials.Mat}
          position={[0, 0, 700_000]}
        />
        <mesh
          geometry={nodes.Cube1_36.geometry}
          material={materials.Mat}
          position={[0, 0, 720_000]}
        />
        <mesh
          geometry={nodes.Cube1_37.geometry}
          material={materials.Mat}
          position={[0, 0, 740_000]}
        />
        <mesh
          geometry={nodes.Cube1_38.geometry}
          material={materials.Mat}
          position={[0, 0, 760_000]}
        />
        <mesh
          geometry={nodes.Cube1_39.geometry}
          material={materials.Mat}
          position={[0, 0, 780_000]}
        />
        <mesh
          geometry={nodes.Cube1_40.geometry}
          material={materials.Mat}
          position={[0, 0, 800_000]}
        />
        <mesh
          geometry={nodes.Cube1_41.geometry}
          material={materials.Mat}
          position={[0, 0, 820_000]}
        />
        <mesh
          geometry={nodes.Cube1_42.geometry}
          material={materials.Mat}
          position={[0, 0, 840_000]}
        />
        <mesh
          geometry={nodes.Cube1_43.geometry}
          material={materials.Mat}
          position={[0, 0, 860_000]}
        />
        <mesh
          geometry={nodes.Cube1_44.geometry}
          material={materials.Mat}
          position={[0, 0, 880_000]}
        />
        <mesh
          geometry={nodes.Cube1_45.geometry}
          material={materials.Mat}
          position={[0, 0, 900_000]}
        />
        <mesh
          geometry={nodes.Cube1_46.geometry}
          material={materials.Mat}
          position={[0, 0, 920_000]}
        />
        <mesh
          geometry={nodes.Cube1_47.geometry}
          material={materials.Mat}
          position={[0, 0, 940_000]}
        />
        <mesh
          geometry={nodes.Cube1_48.geometry}
          material={materials.Mat}
          position={[0, 0, 960_000]}
        />
        <mesh
          geometry={nodes.Cube1_49.geometry}
          material={materials.Mat}
          position={[0, 0, 980_000]}
        />
      </group>
      <group position={[-50_000, 50_000, -490_000]} rotation={[0, 0, 0.01]}>
        <mesh geometry={nodes.Cube1_0_1.geometry} material={materials.Mat} />
        <mesh
          geometry={nodes.Cube1_1_1.geometry}
          material={materials.Mat}
          position={[0, 0, 20_000]}
        />
        <mesh
          geometry={nodes.Cube1_2_1.geometry}
          material={materials.Mat}
          position={[0, 0, 40_000]}
        />
        <mesh
          geometry={nodes.Cube1_3_1.geometry}
          material={materials.Mat}
          position={[0, 0, 60_000]}
        />
        <mesh
          geometry={nodes.Cube1_4_1.geometry}
          material={materials.Mat}
          position={[0, 0, 80_000]}
        />
        <mesh
          geometry={nodes.Cube1_5_1.geometry}
          material={materials.Mat}
          position={[0, 0, 100_000]}
        />
        <mesh
          geometry={nodes.Cube1_6_1.geometry}
          material={materials.Mat}
          position={[0, 0, 120_000]}
        />
        <mesh
          geometry={nodes.Cube1_7_1.geometry}
          material={materials.Mat}
          position={[0, 0, 140_000]}
        />
        <mesh
          geometry={nodes.Cube1_8_1.geometry}
          material={materials.Mat}
          position={[0, 0, 160_000]}
        />
        <mesh
          geometry={nodes.Cube1_9_1.geometry}
          material={materials.Mat}
          position={[0, 0, 180_000]}
        />
        <mesh
          geometry={nodes.Cube1_10_1.geometry}
          material={materials.Mat}
          position={[0, 0, 200_000]}
        />
        <mesh
          geometry={nodes.Cube1_11_1.geometry}
          material={materials.Mat}
          position={[0, 0, 220_000]}
        />
        <mesh
          geometry={nodes.Cube1_12_1.geometry}
          material={materials.Mat}
          position={[0, 0, 240_000]}
        />
        <mesh
          geometry={nodes.Cube1_13_1.geometry}
          material={materials.Mat}
          position={[0, 0, 260_000]}
        />
        <mesh
          geometry={nodes.Cube1_14_1.geometry}
          material={materials.Mat}
          position={[0, 0, 280_000]}
        />
        <mesh
          geometry={nodes.Cube1_15_1.geometry}
          material={materials.Mat}
          position={[0, 0, 300_000]}
        />
        <mesh
          geometry={nodes.Cube1_16_1.geometry}
          material={materials.Mat}
          position={[0, 0, 320_000]}
        />
        <mesh
          geometry={nodes.Cube1_17_1.geometry}
          material={materials.Mat}
          position={[0, 0, 340_000]}
        />
        <mesh
          geometry={nodes.Cube1_18_1.geometry}
          material={materials.Mat}
          position={[0, 0, 360_000]}
        />
        <mesh
          geometry={nodes.Cube1_19_1.geometry}
          material={materials.Mat}
          position={[0, 0, 380_000]}
        />
        <mesh
          geometry={nodes.Cube1_20_1.geometry}
          material={materials.Mat}
          position={[0, 0, 400_000]}
        />
        <mesh
          geometry={nodes.Cube1_21_1.geometry}
          material={materials.Mat}
          position={[0, 0, 420_000]}
        />
        <mesh
          geometry={nodes.Cube1_22_1.geometry}
          material={materials.Mat}
          position={[0, 0, 440_000]}
        />
        <mesh
          geometry={nodes.Cube1_23_1.geometry}
          material={materials.Mat}
          position={[0, 0, 460_000]}
        />
        <mesh
          geometry={nodes.Cube1_24_1.geometry}
          material={materials.Mat}
          position={[0, 0, 480_000]}
        />
        <mesh
          geometry={nodes.Cube1_25_1.geometry}
          material={materials.Mat}
          position={[0, 0, 500_000]}
        />
        <mesh
          geometry={nodes.Cube1_26_1.geometry}
          material={materials.Mat}
          position={[0, 0, 520_000]}
        />
        <mesh
          geometry={nodes.Cube1_27_1.geometry}
          material={materials.Mat}
          position={[0, 0, 540_000]}
        />
        <mesh
          geometry={nodes.Cube1_28_1.geometry}
          material={materials.Mat}
          position={[0, 0, 560_000]}
        />
        <mesh
          geometry={nodes.Cube1_29_1.geometry}
          material={materials.Mat}
          position={[0, 0, 580_000]}
        />
        <mesh
          geometry={nodes.Cube1_30_1.geometry}
          material={materials.Mat}
          position={[0, 0, 600_000]}
        />
        <mesh
          geometry={nodes.Cube1_31_1.geometry}
          material={materials.Mat}
          position={[0, 0, 620_000]}
        />
        <mesh
          geometry={nodes.Cube1_32_1.geometry}
          material={materials.Mat}
          position={[0, 0, 640_000]}
        />
        <mesh
          geometry={nodes.Cube1_33_1.geometry}
          material={materials.Mat}
          position={[0, 0, 660_000]}
        />
        <mesh
          geometry={nodes.Cube1_34_1.geometry}
          material={materials.Mat}
          position={[0, 0, 680_000]}
        />
        <mesh
          geometry={nodes.Cube1_35_1.geometry}
          material={materials.Mat}
          position={[0, 0, 700_000]}
        />
        <mesh
          geometry={nodes.Cube1_36_1.geometry}
          material={materials.Mat}
          position={[0, 0, 720_000]}
        />
        <mesh
          geometry={nodes.Cube1_37_1.geometry}
          material={materials.Mat}
          position={[0, 0, 740_000]}
        />
        <mesh
          geometry={nodes.Cube1_38_1.geometry}
          material={materials.Mat}
          position={[0, 0, 760_000]}
        />
        <mesh
          geometry={nodes.Cube1_39_1.geometry}
          material={materials.Mat}
          position={[0, 0, 780_000]}
        />
        <mesh
          geometry={nodes.Cube1_40_1.geometry}
          material={materials.Mat}
          position={[0, 0, 800_000]}
        />
        <mesh
          geometry={nodes.Cube1_41_1.geometry}
          material={materials.Mat}
          position={[0, 0, 820_000]}
        />
        <mesh
          geometry={nodes.Cube1_42_1.geometry}
          material={materials.Mat}
          position={[0, 0, 840_000]}
        />
        <mesh
          geometry={nodes.Cube1_43_1.geometry}
          material={materials.Mat}
          position={[0, 0, 860_000]}
        />
        <mesh
          geometry={nodes.Cube1_44_1.geometry}
          material={materials.Mat}
          position={[0, 0, 880_000]}
        />
        <mesh
          geometry={nodes.Cube1_45_1.geometry}
          material={materials.Mat}
          position={[0, 0, 900_000]}
        />
        <mesh
          geometry={nodes.Cube1_46_1.geometry}
          material={materials.Mat}
          position={[0, 0, 920_000]}
        />
        <mesh
          geometry={nodes.Cube1_47_1.geometry}
          material={materials.Mat}
          position={[0, 0, 940_000]}
        />
        <mesh
          geometry={nodes.Cube1_48_1.geometry}
          material={materials.Mat}
          position={[0, 0, 960_000]}
        />
        <mesh
          geometry={nodes.Cube1_49_1.geometry}
          material={materials.Mat}
          position={[0, 0, 980_000]}
        />
      </group>
      <mesh geometry={nodes.body.geometry} material={materials.Mat}>
        <mesh
          geometry={nodes.Cap_1.geometry}
          material={materials.Mat}
          position={[0, 2_000_000, 0]}
        />
        <mesh geometry={nodes.Cap_2.geometry} material={materials.Mat} />
      </mesh>
    </group>
  )
}

useGLTF.preload('/threejs/models/pack-model.glb')
