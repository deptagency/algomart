module.exports = {
  /**
   * @param {import('knex').Knex} knex
   */
  async up(knex) {
    await knex.schema.table('pack_templates', (table) => {
      table.boolean('one_pack_per_customer').defaultTo(false).notNullable()
    })

    await knex('directus_fields').insert([
      {
        collection: 'pack_templates',
        field: 'one_pack_per_customer',
        special: 'boolean',
        display: 'boolean',
        display_options: {
          labelOn: 'Customers can only buy a single version of this pack',
          labelOff: 'Customers can buy multiple versions of this pack',
        },
        translations: JSON.stringify([
          { language: 'en-US', translation: 'One pack per customer' },
        ]),
        note: 'When enabled, customers will only be able to purchase one version of the pack, otherwise they can buy as many packs as they want until there are no packs left.',
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
      .whereIn('field', ['one_pack_per_customer'])
      .delete()
  },
}
