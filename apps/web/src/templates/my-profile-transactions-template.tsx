import { PackByOwner, PackType } from '@algomart/schemas'
import Image from 'next/image'
import useTranslation from 'next-translate/useTranslation'

import css from './my-profile-transactions-template.module.css'

import Heading from '@/components/heading'
import Pagination from '@/components/pagination/pagination'
import { formatCurrency, formatIntToFloat } from '@/utils/format-currency'

export interface MyProfileTransactionsTemplateProps {
  currentPage: number
  handlePageChange: (pageNumber: number) => void
  pageSize: number
  releases: PackByOwner[]
  total: number
}

export default function MyProfileTransactionsTemplate({
  currentPage,
  handlePageChange,
  pageSize,
  releases,
  total,
}: MyProfileTransactionsTemplateProps) {
  const { t, lang } = useTranslation()
  const groupByPage = (packs: PackByOwner[] = [], page: number) => {
    const start = (page - 1) * pageSize
    const end = start + pageSize
    return packs.slice(start, end)
  }

  const packs = groupByPage(releases, currentPage)
  return (
    <section>
      <ul className={css.listWrapper}>
        {packs.map((release, index) => {
          const {
            claimedAt,
            type,
            activeBid,
            title,
            image,
            price: releasePrice,
          } = release
          const priceInt =
            type === PackType.Auction
              ? activeBid
              : type === PackType.Purchase
              ? releasePrice
              : 0
          const price = priceInt ? formatIntToFloat(priceInt) : 0

          // Handle pack type
          const wasFree = type === PackType.Free
          const wasRedeem = type === PackType.Redeem
          const wasMonetary =
            type === PackType.Auction || type === PackType.Purchase
          return (
            <li className={css.listItem} key={index}>
              <div className={css.imageColumn}>
                <Image
                  alt={title}
                  className={css.thumbnail}
                  layout="responsive"
                  height="100%"
                  width="100%"
                  src={image}
                />
              </div>
              <div className={css.contentColumn}>
                <Heading className={css.itemTitle} size={3}>
                  {title}
                </Heading>
                <p className={css.itemPrice}>
                  {wasFree && t('common:statuses.Free')}
                  {wasRedeem && t('common:statuses.Redeemable')}
                  {wasMonetary && formatCurrency(price)}
                </p>
                <p>
                  {wasMonetary
                    ? t('common:actions.Purchased on')
                    : t('common:actions.Claimed on')}{' '}
                  {claimedAt &&
                    new Date(claimedAt).toLocaleString(lang, {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                </p>
              </div>
            </li>
          )
        })}
      </ul>
      <Pagination
        currentPage={currentPage}
        pageSize={pageSize}
        setPage={handlePageChange}
        total={total}
      />
    </section>
  )
}
