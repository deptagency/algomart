import { Factory } from 'rosie'

import { randColor } from './color.mjs'

/**
 * Notes:
 * 1. `idx` values don't appear in the DB, they're just iterators for nested properties.
 * 2. `null` values are dynamically populated after the factory built to assign relation.
 * 3.  Order of the sequence/attr properties is arbitrary, but they're ordered here to match the CMS UI.
 */

Factory.define('homepage')
  .sequence('idx')
  .attr('featured_pack', null)
  .attr('upcoming_packs', [])
  .attr('notable_collectibles', [])

Factory.define('rarity')
  .sequence('idx')
  .sequence('code', (seq) => seq)
  .attr('color', ['idx'], () => randColor())
  .attr('translations', ['idx'], (idx) => {
    const rarities = ['Rare', 'Epic', 'Legendary']
    return [
      {
        languages_code: 'en-US',
        name: rarities[idx % rarities.length],
      },
    ]
  })

Factory.define('collectible')
  .sequence('idx')
  .attr('status', 'published')
  .attr('total_editions', 5)
  .sequence('unique_code', (seq) => `asset${seq}`)
  .attr('preview_image', null)
  .attr('translations', ['idx'], (idx) => {
    return [
      {
        languages_code: 'en-US',
        title: `Collectible ${idx} Title`,
        subtitle: `Awesome Subtitle for Collectible ${idx}`,
        body: `A more *in-depth* description about Collectible ${idx}`,
      },
    ]
  })
  .attr('rarity', null)
  .attr('homepage', null)

Factory.define('pack')
  .sequence('idx')
  .attr('status', 'published')
  .sequence('slug', (seq) => `pack-${seq}`)
  .attr('show_nfts', true)
  .attr('nft_order', 'match')
  .attr('nft_distribution', 'one-of-each')
  .attr('nfts_per_pack', null)
  .attr('price', 1000)
  .attr('released_at', new Date().toISOString())
  .attr('type', ['idx'], (idx) => {
    const types = ['free', 'redeem', 'purchase', 'auction']
    return types[idx % types.length]
  })
  .attr('auction_until', ['type'], (type) => {
    if (type === 'auction') {
      const now = new Date()
      const weekFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)
      return weekFromNow.toISOString()
    }
    return null
  })
  .attr('nft_templates', null)
  .attr('additional_images', null)
  .attr('translations', ['idx'], (idx) => {
    return [
      {
        languages_code: 'en-US',
        title: `Pack ${idx} Title`,
        subtitle: `Awesome Subtitle for Pack ${idx}`,
        body: `A more *in-depth* description about Pack ${idx}`,
      },
    ]
  })
  .attr('pack_image', null)
  .attr('homepage', null)

Factory.define('collection')
  .sequence('idx')
  .attr('status', 'published')
  .sequence('slug', (seq) => `collection-${seq}`)
  .attr('collection_image', null)
  .attr('reward_image', null)
  .attr('translations', ['idx'], (idx) => {
    return [
      {
        languages_code: 'en-US',
        name: `Collection ${idx} Name`,
        description: `A more *in-depth* description about Collection ${idx}`,
        reward_prompt:
          'Complete each set of collectibles in this collection to win big!',
        reward_complete:
          'Congratulations! Someone will be in touch about your prize!',
      },
    ]
  })

Factory.define('set')
  .sequence('idx')
  .attr('status', 'published')
  .sequence('slug', (seq) => `set-${seq}`)
  .attr('collection', null)
  .attr('nft_templates', null)
  .attr('translations', ['idx'], (idx) => {
    return [
      {
        languages_code: 'en-US',
        name: `Set ${idx} Name`,
      },
    ]
  })

export { Factory } from 'rosie'
