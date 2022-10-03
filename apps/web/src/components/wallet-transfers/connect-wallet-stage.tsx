import useTranslation from 'next-translate/useTranslation'

import css from './wallet-transfers.module.css'

import Button from '@/components/button'
import { H3 } from '@/components/heading'

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
      <H3>{t('nft:walletConnect.title')}</H3>
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
