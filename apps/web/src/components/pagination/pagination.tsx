import clsx from 'clsx'
import { MouseEvent } from 'react'

import css from './pagination.module.css'

export const PAGE_SIZE = 16

export interface PaginationProps {
  currentPage: number
  pageSize?: number
  setPage: (page: number) => void
  total: number
}

export default function Pagination({
  currentPage,
  setPage,
  pageSize = PAGE_SIZE,
  total,
}: PaginationProps) {
  const numberOfPages = Math.ceil(total / pageSize)
  const pageArray = Array.from(
    { length: numberOfPages },
    (_, index) => index + 1
  )

  const gotoPage = (event: MouseEvent<HTMLButtonElement>) => {
    const targetPage = event.currentTarget.dataset.page
    if (targetPage) setPage(Number.parseInt(targetPage, 10))
  }

  if (pageArray.length < 2) {
    return null
  }

  return (
    <nav aria-label="Pagination" className={clsx(css.navigation)}>
      <div className={css.wrapper}>
        <ul aria-label="Page navigation" className={css.pageNumbersList}>
          {pageArray.map((pageNumber) => (
            <li key={pageNumber} className={css.listItem}>
              <button
                aria-current={Boolean(currentPage === pageNumber)}
                aria-label={`Page ${pageNumber}`}
                className={clsx(css.pageNumber, {
                  [css.currentPageNumber]: currentPage === pageNumber,
                  [css.otherPageNumbers]: currentPage !== pageNumber,
                })}
                data-page={pageNumber}
                onClick={gotoPage}
              >
                {pageNumber}
              </button>
            </li>
          ))}
        </ul>
      </div>
    </nav>
  )
}
