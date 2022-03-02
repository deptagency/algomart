import useTranslation from 'next-translate/useTranslation'

import Heading from '../heading'
import PassphraseInput from '../passphrase-input/passphrase-input'

import css from './wallet-transfers.module.css'

export interface PassphraseStageProps {
  onPassphraseChange: (passphrase: string) => void
}

export default function PassphraseStage(props: PassphraseStageProps) {
  const { t } = useTranslation()
  return (
    <div className={css.stage}>
      <Heading level={3} bold className={css.stageTitle}>
        {t('forms:fields.passphrase.label')}
      </Heading>
      <hr className={css.separator} />
      <PassphraseInput handleChange={props.onPassphraseChange} />
      <div className={css.stageHelp}>
        {t('forms:fields.passphrase.enterPassphrase')}
      </div>
    </div>
  )
}
