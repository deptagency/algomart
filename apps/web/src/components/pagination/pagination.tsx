import clsx from 'clsx'
import { MouseEvent } from 'react'

import css from './pagination.module.css'

export const PAGE_SIZE = 16
export const PAGE_WINDOW_SIZE = 5

export interface PaginationProps {
  currentPage: number
  pageSize?: number
  setPage: (page: number) => void
  total: number
  /**
   * Number of consecutive pages to show in a row.
   * Note: when this doesnt include the start or end page,
   * then these pages will be shown as well.
   */
  pageWindowSize?: number
  className?: string
}

export default function Pagination({
  className,
  currentPage,
  setPage,
  pageSize = PAGE_SIZE,
  pageWindowSize = PAGE_WINDOW_SIZE,
  total,
}: PaginationProps) {
  const numberOfPages = Math.ceil(total / pageSize)
  const lastPage = numberOfPages

  const pageArray = Array.from(
    { length: numberOfPages },
    (_, index) => index + 1
  ).slice(
    Math.max(0, currentPage - Math.ceil(pageWindowSize / 2)),
    Math.min(numberOfPages, currentPage + Math.floor(pageWindowSize / 2))
  )

  const gotoPage = (event: MouseEvent<HTMLButtonElement>) => {
    const targetPage = event.currentTarget.dataset.page
    if (targetPage) setPage(Number.parseInt(targetPage, 10))
  }

  if (pageArray.length < 2) {
    return null
  }

  const renderPage = (pageNumber: number) => (
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
  )

  return (
    <nav aria-label="Pagination" className={clsx(css.root, className)}>
      <ul aria-label="Page navigation" className={css.pageNumbersList}>
        {!pageArray.includes(1) && renderPage(1)}
        {!pageArray.includes(2) && <li className={css.listItem}>...</li>}
        {pageArray.map(renderPage)}
        {!pageArray.includes(lastPage - 1) && (
          <li className={css.listItem}>...</li>
        )}
        {!pageArray.includes(lastPage) && renderPage(lastPage)}
      </ul>
    </nav>
  )
}
