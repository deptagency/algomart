import useTranslation from 'next-translate/useTranslation'

import css from './wallet-transfers.module.css'

import Button from '@/components/button'
import Heading from '@/components/heading'

export interface SellListDetailsStageProps {
  onConfirm: () => void
  onCancel: () => void
  confirmLabel: string
}

export default function SellListDetailsStage(props: SellListDetailsStageProps) {
  const { t } = useTranslation()
  return (
    <div key="select-account" className={css.stage}>
      <Heading level={3} bold className={css.stageTitle}>
        {t('nft:walletConnect.destinationWallet')}
      </Heading>
      <hr className={css.separator} />
      <div className={css.spacing}>
        <Button
          onClick={props.onCancel}
          size="small"
          variant="link"
          fullWidth
          className={css.buttonLink}
        >
          {t('nft:walletConnect.orCancel')}
        </Button>
      </div>
    </div>
  )
}
