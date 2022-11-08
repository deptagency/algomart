import useTranslation from 'next-translate/useTranslation'
import { useCallback } from 'react'

import css from './wallet-instructions-modal.module.css'

import Button from '@/components/button'
import Dialog, { DialogProps } from '@/components/dialog/dialog'
import { H1, H2 } from '@/components/heading'

export default function WalletInstructionsModal({
  dialogProps,
  onClose,
  open,
}: DialogProps) {
  const { t } = useTranslation()

  const handleClose = useCallback(
    (open: boolean) => {
      onClose(open)
    },
    [onClose]
  )

  return (
    <Dialog
      containerClassName={css.container}
      contentClassName={css.dialog}
      onClose={handleClose}
      open={open}
      dialogProps={dialogProps}
    >
      <div className={css.root}>
        <header>
          <Button
            aria-label={t('common:actions.Close')}
            className={css.closeButton}
            onClick={() => handleClose(false)}
            variant="ghost"
          >
            {'\u2717'}
          </Button>
        </header>
        <H1 mb={5}>
          {t('forms:fields.payWithCrypto.walletInstructions.label')}
        </H1>
        <hr />
        <section className={css.section}>
          <H2>
            {t(
              'forms:fields.payWithCrypto.walletInstructions.createWallet.label'
            )}
          </H2>
          <ol className={css.list}>
            <li>
              {t(
                'forms:fields.payWithCrypto.walletInstructions.createWallet.1'
              )}
            </li>
            <li>
              {t(
                'forms:fields.payWithCrypto.walletInstructions.createWallet.2'
              )}
            </li>
            <li>
              {t(
                'forms:fields.payWithCrypto.walletInstructions.createWallet.3'
              )}
            </li>
          </ol>
          <a
            className={css.link}
            href="https://algorandwallet.com/support/getting-started/creating-a-new-account/"
            target="_blank"
            rel="noreferrer"
          >
            {t(
              'forms:fields.payWithCrypto.walletInstructions.createWallet.link'
            )}
          </a>
        </section>
        <hr />
        <section className={css.section}>
          <H2>
            {t(
              'forms:fields.payWithCrypto.walletInstructions.purchaseAlgos.label'
            )}
          </H2>
          <p className={css.notice}>
            {t(
              'forms:fields.payWithCrypto.walletInstructions.purchaseAlgos.notice'
            )}
          </p>
          <ol className={css.list}>
            <li>
              {t(
                'forms:fields.payWithCrypto.walletInstructions.purchaseAlgos.1'
              )}
            </li>
            <li>
              {t(
                'forms:fields.payWithCrypto.walletInstructions.purchaseAlgos.2'
              )}
            </li>
            <li>
              {t(
                'forms:fields.payWithCrypto.walletInstructions.purchaseAlgos.3'
              )}
            </li>
          </ol>
          <a
            className={css.link}
            href="https://help.coinbase.com/en/wallet/sending-and-receiving/how-do-i-move-assets-between-my-coinbase-wallet-and-my-coinbase"
            target="_blank"
            rel="noreferrer"
          >
            {t(
              'forms:fields.payWithCrypto.walletInstructions.purchaseAlgos.link'
            )}
          </a>
        </section>
        <hr />
        <section className={css.section}>
          <H2>
            {t('forms:fields.payWithCrypto.walletInstructions.swapAlgos.label')}
          </H2>
          <p className={css.notice}>
            {t(
              'forms:fields.payWithCrypto.walletInstructions.swapAlgos.notice'
            )}
          </p>
          <ol className={css.list}>
            <li>
              {t('forms:fields.payWithCrypto.walletInstructions.swapAlgos.1')}
            </li>
            <li>
              {t('forms:fields.payWithCrypto.walletInstructions.swapAlgos.2')}
            </li>
            <li>
              {t('forms:fields.payWithCrypto.walletInstructions.swapAlgos.3')}
            </li>
            <li>
              {t('forms:fields.payWithCrypto.walletInstructions.swapAlgos.4')}
            </li>
          </ol>
          <a
            className={css.link}
            href="https://tinyman.org/"
            target="_blank"
            rel="noreferrer"
          >
            {t('forms:fields.payWithCrypto.walletInstructions.swapAlgos.link')}
          </a>
        </section>
      </div>
    </Dialog>
  )
}
