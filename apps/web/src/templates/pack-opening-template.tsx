import { animated, config, useSpring } from '@react-spring/web'
import dynamic from 'next/dynamic'

import PackGrid from '@/components/pack-grid/pack-grid'
import CanvasContainer from '@/components/r3f/canvas-container/canvas-container'
import { usePackOpening } from '@/contexts/pack-opening-context'

// Load on client only, since server can't render canvas
const PackOpeningCanvas = dynamic(
  () => import('@/components/r3f/scenes/pack-opening/pack-opening'),
  { ssr: false }
)

export default function PackOpeningTemplate() {
  const { packToOpen, sceneComplete, sceneMounted, setSceneMounted } =
    usePackOpening()

  const { sceneOpacity } = useSpring({
    config: config.molasses,
    delay: 2000,
    sceneOpacity: sceneComplete ? 0 : 1,
    onRest: () => {
      // Unmounts the experience when animation is complete to prevent memory leaks
      setSceneMounted(false)
    },
  })

  return (
    <>
      {/* R3F Scene */}
      {sceneMounted && (
        <animated.div
          className="relative z-30"
          style={{
            opacity: sceneOpacity.to({ range: [1, 0], output: [1, 0] }),
          }}
        >
          <CanvasContainer>
            <PackOpeningCanvas />
          </CanvasContainer>
        </animated.div>
      )}

      {/* Pack Contents */}
      {sceneComplete && (
        <PackGrid
          packCards={packToOpen.collectibles}
          packTitle={packToOpen.title}
        />
      )}
    </>
  )
}
