import useTranslation from 'next-translate/useTranslation'

import css from './release-packContents.module.css'

export interface ReleasePackContentsProps {
  nftsPerPack: number
  nftCategory?: string
}

const ReleasePackContents = ({
  nftsPerPack,
  nftCategory,
}: ReleasePackContentsProps) => {
  const { t } = useTranslation()
  const Items = () => {
    const length = nftsPerPack
    return (
      <>
        {Array.from({ length }).map((_, index) => (
          <div key={`release-item-${index}`} className={css.item}>
            ?
          </div>
        ))}
      </>
    )
  }
  return (
    <div className={css.root}>
      <div className={css.header}>
        {t('release:packContents', {
          nftsPerPack,
          nftCategory: nftCategory || 'NFTs',
        })}
        :
      </div>
      <div className={css.items}>{<Items />}</div>
    </div>
  )
}

export default ReleasePackContents
