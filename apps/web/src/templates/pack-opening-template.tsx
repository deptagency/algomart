import { animated, config, useSpring } from '@react-spring/web'
import dynamic from 'next/dynamic'

import css from './pack-opening-template.module.css'
import canvas from '@/components/r3f/canvas-container/canvas-container.module.css'

import PackGrid from '@/components/pack-grid/pack-grid'
import CanvasContainer from '@/components/r3f/canvas-container/canvas-container'
import { usePackOpening } from '@/contexts/pack-opening-context'

// Load on client only, since server can't render canvas
const PackOpeningCanvas = dynamic(
  () => import('@/components/r3f/scenes/pack-opening/pack-opening'),
  { ssr: false }
)

export default function PackOpeningTemplate() {
  const { packToOpen, sceneComplete, sceneMounted } = usePackOpening()

  const { sceneOpacity } = useSpring({
    config: config.molasses,
    delay: 2000,
    sceneOpacity: sceneComplete ? 0 : 1,
  })

  return (
    <>
      <section className={css.packOpeningBackground}>
        {/* R3F Scene */}
        {sceneMounted && (
          <animated.div
            className="relative z-30"
            // style={{
            //   opacity: sceneOpacity.to({ range: [1, 0], output: [1, 0] }),
            // }}
          >
            <CanvasContainer>
              <PackOpeningCanvas />
            </CanvasContainer>
          </animated.div>
        )}

        {/* Pack Contents */}
        {sceneComplete && (
          <section className={css.contentWrapper}>
            <PackGrid
              packCards={packToOpen.collectibles}
              packId={packToOpen.id}
              packTitle={packToOpen.title}
              transitionStyle="interactive"
            />
          </section>
        )}
        <div className={canvas.radialGradient} />
      </section>
    </>
  )
}
