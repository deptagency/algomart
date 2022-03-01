import { MintPackStatus } from '@algomart/schemas'
import { animated, config, useSpring } from '@react-spring/web'
import dynamic from 'next/dynamic'
import { useState } from 'react'

import css from './pack-opening-template.module.css'

import TransferModal from '@/components/modals/transfer-modal'
import PackGrid from '@/components/pack-grid/pack-grid'
import CanvasContainer from '@/components/r3f/canvas-container/canvas-container'
import { usePackOpening } from '@/contexts/pack-opening-context'
import { usePackMintStatus } from '@/hooks/use-pack-mint-status'
import { useTransferPack } from '@/hooks/use-transfer-pack'

// Load on client only, since server can't render canvas
const PackOpeningCanvas = dynamic(
  () => import('@/components/r3f/scenes/pack-opening/pack-opening'),
  { ssr: false }
)

export default function PackOpeningTemplate() {
  const { packToOpen, sceneComplete, sceneMounted, setSceneMounted } =
    usePackOpening()
  const [showTransfer, setShowTransfer] = useState(false)
  const mintStatus = usePackMintStatus(packToOpen.id)
  const [transfer, status, reset] = useTransferPack(packToOpen.id)

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
    <section className={css.packOpeningBackground}>
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
        <section className={css.contentWrapper}>
          <PackGrid
            packCards={packToOpen.collectibles}
            packTitle={packToOpen.title}
            enableTransfer={mintStatus === MintPackStatus.Minted}
            onTransfer={() => {
              setShowTransfer(true)
            }}
          />
          <TransferModal
            open={showTransfer}
            onClose={(open: boolean) => {
              setShowTransfer(open)
              setTimeout(() => reset(), 500)
            }}
            onRetry={reset}
            packTemplate={packToOpen}
            transferStatus={status}
            onSubmit={transfer}
          />
        </section>
      )}
    </section>
  )
}
