import { RoundedBox, Text } from '@react-three/drei'
import { CubeTexture, DoubleSide } from 'three'

interface TextBoxProps {
  boxDimensions?: [number, number, number]
  envMap?: CubeTexture
  envMapIntensity?: number
  groupPositionX?: number
  groupPositionY?: number
  text: string
  textDimensions?: [number, number, number]
}

export default function TextBox({
  boxDimensions,
  envMap,
  envMapIntensity,
  groupPositionX,
  groupPositionY,
  text,
  textDimensions,
}: TextBoxProps) {
  return (
    <group position-x={groupPositionX} position-y={groupPositionY}>
      <RoundedBox args={boxDimensions} position-z={1.4} radius={0.25}>
        <meshStandardMaterial
          attach="material"
          color="#fff"
          envMapIntensity={envMapIntensity}
          side={DoubleSide}
          transparent
        />
      </RoundedBox>
      <Text
        anchorX="center"
        anchorY="middle"
        color="white"
        position-z={2}
        scale={textDimensions}
      >
        <meshStandardMaterial
          attach="material"
          envMap={envMap}
          side={DoubleSide}
          envMapIntensity={envMapIntensity}
          metalness={1}
          roughness={0}
        />
        {text}
      </Text>
    </group>
  )
}
