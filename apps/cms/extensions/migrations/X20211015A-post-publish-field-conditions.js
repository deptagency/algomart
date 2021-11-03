module.exports = {
  /**
   * @param {import('knex').Knex} knex
   */
  async up(knex) {
    await knex('directus_fields')
      .where('collection', 'pack_templates')
      .whereIn('field', [
        'status',
        'slug',
        'type',
        'price',
        'released_at',
        'auction_until',
        'show_nfts',
        'nft_order',
        'nft_distribution',
        'nfts_per_pack',
        'nft_templates',
        'one_pack_per_customer',
        'allow_bid_expiration',
      ])
      .update({
        conditions: JSON.stringify([
          {
            name: 'No editing after publish',
            rule: {
              _and: [
                {
                  status: { _eq: 'published' },
                },
              ],
            },
            readonly: true,
          },
        ]),
      })

    await knex('directus_fields')
      .where('collection', 'nft_templates')
      .whereIn('field', [
        'status',
        'total_editions',
        'unique_code',
        'pack_template',
        'rarity',
        'set',
        'collection',
      ])
      .update({
        conditions: JSON.stringify([
          {
            name: 'No editing after publish',
            rule: {
              _and: [
                {
                  status: { _eq: 'published' },
                },
              ],
            },
            readonly: true,
          },
        ]),
      })

    await knex('directus_fields')
      .where('collection', 'sets')
      .whereIn('field', ['status', 'slug', 'collection', 'nft_templates'])
      .update({
        conditions: JSON.stringify([
          {
            name: 'No editing after publish',
            rule: {
              _and: [
                {
                  status: { _eq: 'published' },
                },
              ],
            },
            readonly: true,
          },
        ]),
      })

    await knex('directus_fields')
      .where('collection', 'collections')
      .whereIn('field', ['status', 'slug', 'sets', 'nft_templates'])
      .update({
        conditions: JSON.stringify([
          {
            name: 'No editing after publish',
            rule: {
              _and: [
                {
                  status: { _eq: 'published' },
                },
              ],
            },
            readonly: true,
          },
        ]),
      })
  },

  /**
   * @param {import('knex').Knex} knex
   */
  async down(knex) {
    await knex('directus_fields')
      .where('collection', 'pack_templates')
      .whereIn('field', [
        'status',
        'slug',
        'type',
        'price',
        'released_at',
        'auction_until',
        'show_nfts',
        'nft_order',
        'nft_distribution',
        'nfts_per_pack',
        'nft_templates',
        'one_pack_per_customer',
        'allow_bid_expiration',
      ])
      .update({ conditions: null })

    await knex('directus_fields')
      .where('collection', 'nft_templates')
      .whereIn('field', [
        'status',
        'total_editions',
        'unique_code',
        'pack_template',
        'rarity',
        'set',
        'collection',
      ])
      .update({ conditions: null })

    await knex('directus_fields')
      .where('collection', 'sets')
      .whereIn('field', ['status', 'slug', 'collection', 'nft_templates'])
      .update({ conditions: null })

    await knex('directus_fields')
      .where('collection', 'collections')
      .whereIn('field', ['status', 'slug', 'sets', 'nft_templates'])
      .update({ conditions: null })
  },
}
