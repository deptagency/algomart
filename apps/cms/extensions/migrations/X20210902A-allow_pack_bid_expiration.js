module.exports = {
  /**
   * @param {import('knex').Knex} knex
   */
  async up(knex) {
    await knex.schema.table('pack_templates', (table) => {
      table.boolean('allow_bid_expiration').defaultTo(false).notNullable()
    })

    await knex('directus_fields').insert([
      {
        collection: 'pack_templates',
        field: 'allow_bid_expiration',
        special: 'boolean',
        display: 'boolean',
        display_options: {
          labelOn: 'Expired bids go to next high bidder',
          labelOff: 'Bids do not expire',
        },
        translations: JSON.stringify([
          { language: 'en-US', translation: 'Allow bid expiration' },
        ]),
        note: 'When enabled, bidders will have 72 hours to compelte their purchase, otherwise the next highest bidder with a bid above the reserve price will become the new winner.',
        width: 'half',
      },
    ])
  },

  /**
   * @param {import('knex').Knex} knex
   */
  async down(knex) {
    await knex('directus_fields')
      .where('collection', 'pack_templates')
      .whereIn('field', ['allow_bid_expiration'])
      .delete()
  },
}
