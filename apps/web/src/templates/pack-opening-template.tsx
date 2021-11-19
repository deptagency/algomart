import {
  CheckCircleIcon,
  ExclamationCircleIcon,
} from '@heroicons/react/outline'
import { animated, config, useSpring } from '@react-spring/web'
import dynamic from 'next/dynamic'
import { useRouter } from 'next/router'
import useTranslation from 'next-translate/useTranslation'
import { FormEvent, useCallback, useState } from 'react'

import css from './pack-opening-template.module.css'

import Button from '@/components/button'
import Dialog from '@/components/dialog/dialog'
import Loading from '@/components/loading/loading'
import PackGrid from '@/components/pack-grid/pack-grid'
import PassphraseInput from '@/components/passphrase-input/passphrase-input'
import CanvasContainer from '@/components/r3f/canvas-container/canvas-container'
import { usePackOpening } from '@/contexts/pack-opening-context'
import { TransferPackStatus, useTransferPack } from '@/hooks/use-transfer-pack'
import { urls } from '@/utils/urls'

// Load on client only, since server can't render canvas
const PackOpeningCanvas = dynamic(
  () => import('@/components/r3f/scenes/pack-opening/pack-opening'),
  { ssr: false }
)

export default function PackOpeningTemplate() {
  const { packToOpen, sceneComplete, sceneMounted, setSceneMounted } =
    usePackOpening()
  const [transfer, status, reset] = useTransferPack(packToOpen.id)
  const [showPassphraseDialog, setShowPassphraseDialog] = useState(false)
  const [passphrase, setPassphrase] = useState('')
  const { t } = useTranslation()
  const router = useRouter()

  const { sceneOpacity } = useSpring({
    config: config.molasses,
    delay: 2000,
    sceneOpacity: sceneComplete ? 0 : 1,
    onRest: () => {
      // Unmounts the experience when animation is complete to prevent memory leaks
      setSceneMounted(false)
    },
  })

  const handleSubmit = useCallback(
    async (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault()
      await transfer(passphrase)
    },
    [passphrase, transfer]
  )

  const loadingText = {
    [TransferPackStatus.Idle]: t('common:statuses.Idle'),
    [TransferPackStatus.Transferring]: t('common:statuses.Transferring'),
    [TransferPackStatus.Success]: t('common:statuses.Success'),
    [TransferPackStatus.Error]: t('common:statuses.Error'),
  }[status]

  const closeDialog = useCallback(() => {
    setShowPassphraseDialog(false)
    setTimeout(() => reset(), 500)
  }, [reset])

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
        <>
          <PackGrid
            packCards={packToOpen.collectibles}
            packTitle={packToOpen.title}
          />
          <div>
            <Button onClick={() => setShowPassphraseDialog(true)}>
              Claim collectibles
            </Button>
          </div>
          <Dialog
            containerClassName={css.container}
            contentClassName={css.dialog}
            open={showPassphraseDialog}
            onClose={closeDialog}
          >
            <div className={css.root}>
              {status === TransferPackStatus.Idle && (
                <form className={css.form} onSubmit={handleSubmit}>
                  {/* Passphrase */}
                  <div className={css.passphrase}>
                    <PassphraseInput
                      label={t('forms:fields.passphrase.label')}
                      handleChange={setPassphrase}
                    />
                    <p className={css.instructionText}>
                      {t('release:passphraseApprove')}
                    </p>
                  </div>

                  {/* Submit */}
                  <Button
                    fullWidth
                    disabled={!passphrase}
                    variant="primary"
                    type="submit"
                  >
                    {t('common:actions.Claim My Edition')}
                  </Button>
                </form>
              )}

              {status === TransferPackStatus.Transferring && (
                <div className={css.loadingWrapper}>
                  <Loading loadingText={loadingText} variant="secondary" />
                </div>
              )}

              {status === 'error' && (
                <div className={css.statusWrapper}>
                  <ExclamationCircleIcon className={css.errorIcon} />
                  <h3 className={css.statusHeading}>
                    {t('common:statuses.An Error has Occurred')}
                  </h3>
                  <p className={css.statusMessage}>
                    {t('release:failedToClaim')}
                  </p>
                  <Button
                    className={css.button}
                    onClick={closeDialog}
                    size="small"
                  >
                    {t('common:actions.Try Again')}
                  </Button>
                </div>
              )}

              {status === 'success' && (
                <div className={css.statusWrapper}>
                  <CheckCircleIcon className={css.successIcon} />
                  <h3 className={css.statusHeading}>
                    {t('common:statuses.Success!')}
                  </h3>
                  <p className={css.statusMessage}>
                    {t('release:successConfirmation', {
                      name: packToOpen.title,
                    })}
                  </p>
                  <Button
                    className={css.button}
                    onClick={() => {
                      router.push(urls.myCollectibles)
                    }}
                    size="small"
                  >
                    {t('common:actions.View Collection')}
                  </Button>
                </div>
              )}
            </div>
          </Dialog>
        </>
      )}
    </>
  )
}
