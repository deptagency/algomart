import { SortDirection } from '@algomart/schemas'
import { useState } from 'react'

const SORTS = ['asc', 'desc', undefined]

const usePagination = (
  page = 1,
  sortBy: string,
  sortDirection: SortDirection = SortDirection.Descending
) => {
  const [pagination, _setPagination] = useState({ page, sortBy, sortDirection })

  const setPagination = (newPagination) => {
    _setPagination({ ...pagination, ...newPagination })
  }

  const setPage = (page) => setPagination({ page })
  const setSortBy = (sortBy) => setPagination({ sortBy })
  const setSortDirection = (sortDirection) => setPagination({ sortDirection })

  const handleSortBy = (newSortBy) => {
    const nextSortDirection =
      pagination.sortBy === newSortBy
        ? SORTS[(SORTS.indexOf(pagination.sortDirection) + 1) % SORTS.length]
        : SORTS[0]
    setPagination({
      page: 1,
      sortBy: nextSortDirection ? newSortBy : undefined,
      sortDirection: nextSortDirection,
    })
  }

  const handleTableHeaderClick = ({ key }) => handleSortBy(key)

  return {
    pagination,
    page: pagination.page,
    sortBy: pagination.sortBy,
    sortDirection: pagination.sortDirection,
    handleSortBy,
    handleTableHeaderClick,
    setPagination,
    setPage,
    setSortBy,
    setSortDirection,
  }
}

export default usePagination
