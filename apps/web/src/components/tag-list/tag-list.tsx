import { Tag } from '@algomart/schemas'
import { useRouter } from 'next/router'
import { MouseEvent } from 'react'

import css from './tag-list.module.css'

import Pill from '@/components/pill'
import { urls } from '@/utils/urls'

export interface TagListProps {
  limit?: number
  tags: Tag[]
  tagType?: 'collectible' | 'pack'
}

export default function TagList({
  limit,
  tags,
  tagType = 'collectible',
}: TagListProps) {
  const { push } = useRouter()

  return (
    <>
      {/* If a limit is passed, only return that ammount of tags */}
      {tags.slice(0, limit ?? tags.length).map(({ title, slug }) => {
        // Construct URL
        const baseUrl = tagType === 'pack' ? urls.drops : urls.marketplace
        const urlWithSearch = `${baseUrl}?tags[]=${slug}`

        return (
          // Can't use <AppLink/> here, could already be wrapped in one by a parent
          <button
            className={css.link}
            onClick={(event: MouseEvent<HTMLButtonElement>) => {
              event.preventDefault()
              push(urlWithSearch)
            }}
            key={slug}
          >
            <Pill small>{title}</Pill>
          </button>
        )
      })}
    </>
  )
}
