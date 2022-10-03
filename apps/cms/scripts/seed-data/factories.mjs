import { Factory } from 'rosie'

/**
 * Notes:
 * 1. `idx` values don't appear in the DB, they're just iterators for nested properties.
 * 2. `null` values are dynamically populated after the factory built to assign relation.
 * 3.  Order of the sequence/attr properties is arbitrary, but they're ordered here to match the CMS UI.
 */

Factory.define('homepage')
  .sequence('idx')
  .attr('hero_pack', null)
  .attr('upcoming_packs', [])
  .attr('notable_collectibles', [])
  .attr('translations', ['idx'], () => {
    return [
      {
        languages_code: 'en-UK',
        hero_banner_title: 'Start collecting now',
        featured_packs_title: 'Featured Packs',
        featured_packs_subtitle: 'Latest Drops',
        featured_nfts_title: 'Featured NFTs',
        featured_nfts_subtitle: 'Recently Collected NFTs',
      },
    ]
  })

Factory.define('page')
  .attr('status', 'published')
  .attr('slug', null)
  .attr('hero_banner', null)
  .attr('translations', ['slug'], (slug) => {
    return [{ languages_code: 'en-UK' }]
  })

// NOTE: Rarest first so we can simulate actual rarity in seed script.
export const raritiesMeta = [
  {
    name: 'Gold',
    description: 'Gold Description',
    code: '1',
    languages_code: 'en-UK',
    color: '#d1bc00',
  },
  {
    name: 'Silver',
    description: 'Silver Description',
    code: '2',
    languages_code: 'en-UK',
    color: '#9e9e9e',
  },
  {
    name: 'Bronze',
    description: 'Bronze Description',
    code: '3',
    languages_code: 'en-UK',
    color: '#d98200',
  },
]

Factory.define('rarity')
  .sequence('idx')
  .sequence('code', ['idx'], (seq) => raritiesMeta[seq - 1].code)
  .attr('color', ['idx'], (seq) => raritiesMeta[seq - 1].color)
  .attr('translations', ['idx'], (idx) => [
    {
      languages_code: 'en-UK',
      name: raritiesMeta[idx - 1].name,
      description: raritiesMeta[idx - 1].description,
    },
  ])

Factory.define('collectible')
  .sequence('idx')
  .attr('status', 'published')
  .attr('total_editions', 5)
  .sequence('unique_code', (seq) => `asset${seq}`)
  .attr('preview_image', null)
  .attr('translations', ['idx'], (idx) => {
    return [
      {
        languages_code: 'en-UK',
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
  .sequence('released_at', (seq) =>
    // stagger release times by 1 minute for sortability
    new Date(Date.now() + 1000 * 60 * seq).toISOString()
  )
  .attr('type', ['idx'], (idx) => {
    const types = ['free', 'redeem', 'purchase', 'auction']
    return types[idx % types.length]
  })
  .attr('price', ['type'], (type) =>
    type === 'free' || type === 'redeem'
      ? 0
      : Math.ceil(Math.random() * 15) * 100
  )
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
        languages_code: 'en-UK',
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
        languages_code: 'en-UK',
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
        languages_code: 'en-UK',
        name: `Set ${idx} Name`,
      },
    ]
  })

export { Factory } from 'rosie'
