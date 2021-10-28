module.exports = {
  /**
   * @param {import('knex').Knex} knex
   */
  async up(knex) {
    await knex.schema.alterTable('nft_templates', (table) => {
      table.uuid('homepage').references('id').inTable('homepage')
    })

    await knex('directus_fields').insert([
      {
        collection: 'homepage',
        field: 'notable_collectibles',
        special: 'o2m',
        interface: 'list-o2m',
        options: { template: '{{preview_image.$thumbnail}} {{unique_code}}' },
        display: 'related-values',
        display_options: {
          template: '{{preview_image.$thumbnail}} {{unique_code}}',
        },
      },
      {
        collection: 'nft_templates',
        field: 'homepage',
        hidden: true,
      },
    ])

    await knex('directus_relations').insert([
      {
        many_collection: 'nft_templates',
        many_field: 'homepage',
        one_collection: 'homepage',
        one_field: 'notable_collectibles',
      },
    ])
  },

  /**
   * @param {import('knex').Knex} knex
   */
  async down(knex) {
    await knex('directus_fields')
      .where('collection', 'homepage')
      .andWhere('field', 'notable_collectibles')
      .delete()
    await knex('directus_fields')
      .where('collection', 'nft_templates')
      .andWhere('field', 'homepage')
      .delete()
    await knex('directus_relations')
      .where('one_collection', 'homepage')
      .andWhere('one_field', 'notable_collectibles')
      .delete()
    await knex.schema.alterTable('nft_templates', (table) => {
      table.dropColumn('homepage')
    })
  },
}
