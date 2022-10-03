import { Tag } from '@algomart/schemas'
import { SearchIcon } from '@heroicons/react/outline'
import { useEffect, useState } from 'react'

import css from './browse-products-filters.module.css'

import FilterableSelect from '@/components/filterable-select'
import Pill from '@/components/pill'
import { useTagsList } from '@/hooks/api/use-tags-list'
import { useTagsSearch } from '@/hooks/api/use-tags-search'
import { useDebouncedCallback } from '@/hooks/use-debounced-callback'
import { usePackFilter } from '@/hooks/use-pack-filter'

const indexBy = (array: unknown[], field: string) =>
  array.reduce((dict, item) => {
    dict[item[field]] = item
    return dict
  }, {})

interface TagDict {
  [key: string]: Tag
}

export default function BrowseProductsFilterTags() {
  const [query, setQuery] = useState('')
  const [tagsBySlug, setTagsBySlug] = useState<TagDict>({})
  // We need to manage state in two places since usePackFilter doesn't store tag
  // titles in the URL query params.
  const { tags: tagSlugs, updateState } = usePackFilter()
  const { data: searchData, isFetching } = useTagsSearch(query)

  // Because usePackFilter doesn't have access to tag titles we need to fetch them
  // if the page is initially loaded with filters set (via the URL query params).
  const unmappedTags = tagSlugs.filter((tag) => !(tag in tagsBySlug))
  const { data: tagData, isFetching: isFetchingTitles } =
    useTagsList(unmappedTags)

  useEffect(() => {
    setTagsBySlug({
      ...tagsBySlug,
      ...(indexBy(tagData || [], 'slug') as TagDict),
    })
  }, [tagData]) // eslint-disable-line react-hooks/exhaustive-deps

  const options = (searchData || [])
    .map((tag) => ({ label: tag.title, value: tag.slug }))
    .filter((tag) => !(tag.value in tagsBySlug))

  const handleAddTag = (slug, option) => {
    setTagsBySlug({
      ...tagsBySlug,
      [slug]: { slug, title: option.label },
    })
    updateState({ tags: [...tagSlugs, slug] })
    setQuery('')
  }

  const handleRemoveTag = (slug: string) => {
    delete tagsBySlug[slug]
    setTagsBySlug(tagsBySlug)
    updateState({
      tags: tagSlugs.filter((t) => t !== slug),
    })
  }

  const handleQueryChange = useDebouncedCallback(setQuery, 400)

  return (
    <div className={css.filterRow}>
      <FilterableSelect
        density="compact"
        noMargin
        queryValue={query}
        onQueryChange={handleQueryChange}
        options={options}
        Icon={SearchIcon}
        onChange={handleAddTag}
        placeholder="Search"
        isLoading={isFetching}
        minCharactersForSuggestions={2}
        variant="solid"
      />
      <ul className={css.tagList}>
        {!isFetchingTitles &&
          tagSlugs.map((tag) => (
            <Pill small key={tag} onRemove={() => handleRemoveTag(tag)}>
              {tagsBySlug[tag]?.title || tag}
            </Pill>
          ))}
      </ul>
    </div>
  )
}
