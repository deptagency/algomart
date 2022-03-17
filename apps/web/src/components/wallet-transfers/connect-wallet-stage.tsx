import useTranslation from 'next-translate/useTranslation'

import Button from '../button'
import Heading from '../heading'

import css from './wallet-transfers.module.css'

export const ALGORAND_WALLET_LINK = {
  url: 'https://algorandwallet.com',
  text: 'algorandwallet.com',
}

export interface ConnectWalletStageProps {
  onConnectWallet: () => void
}

export default function ConnectWalletStage(props: ConnectWalletStageProps) {
  const { t } = useTranslation()
  return (
    <div key="connect" className={css.stage}>
      <Heading level={3} bold className={css.stageTitle}>
        {t('nft:walletConnect.title')}
      </Heading>
      <hr className={css.separator} />
      <Button fullWidth onClick={props.onConnectWallet}>
        {t('nft:walletConnect.connect')}
      </Button>
      <div className={css.stageHelp}>
        {t('nft:walletConnect.description')}
        <br />
        <br />
        {t('nft:walletConnect.helpText')}
        <br />
        <a
          href={ALGORAND_WALLET_LINK.url}
          target="_blank"
          rel="noreferrer nofollow"
          className={css.link}
        >
          {ALGORAND_WALLET_LINK.text}
        </a>
      </div>
    </div>
  )
}
