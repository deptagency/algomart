module.exports = {
  /**
   * @param {import('knex').Knex} knex
   */
  async up(knex) {
    await knex.schema.createTable('homepage', (table) => {
      table.uuid('id').primary()
      table.uuid('featured_pack').references('id').inTable('pack_templates')
    })

    await knex.schema.alterTable('pack_templates', (table) => {
      table.uuid('homepage').references('id').inTable('homepage')
    })

    await knex('directus_collections').insert([
      {
        collection: 'homepage',
        icon: 'house',
        note: 'Configure packs shown on homepage.',
        singleton: true,
      },
    ])
    await knex('directus_fields').insert([
      {
        collection: 'homepage',
        field: 'id',
        special: 'uuid',
        readonly: true,
        hidden: true,
        interface: 'input',
      },
      {
        collection: 'homepage',
        field: 'featured_pack',
        interface: 'select-dropdown-m2o',
        options: { template: '{{slug}} {{type}}' },
        display: 'related-values',
        display_options: { template: '{{slug}} {{type}}' },
      },
      {
        collection: 'homepage',
        field: 'upcoming_packs',
        special: 'o2m',
        interface: 'list-o2m',
        options: { template: '{{slug}} {{type}}' },
        display: 'related-values',
        display_options: { template: '{{slug}} {{type}}' },
      },
      {
        collection: 'pack_templates',
        field: 'homepage',
        hidden: true,
      },
    ])

    await knex('directus_relations').insert([
      {
        many_collection: 'homepage',
        many_field: 'featured_pack',
        one_collection: 'pack_templates',
      },
      {
        many_collection: 'pack_templates',
        many_field: 'homepage',
        one_collection: 'homepage',
        one_field: 'upcoming_packs',
      },
    ])
  },

  /**
   * @param {import('knex').Knex} knex
   */
  async down(knex) {
    await knex('directus_fields')
      .where('collection', 'homepage')
      .orWhere('field', 'homepage')
      .delete()
    await knex('directus_collections').where('collection', 'homepage').delete()
    await knex('directus_relations')
      .where('many_collection', 'homepage')
      .orWhere('one_collection', 'homepage')
      .delete()
    await knex.schema.alterTable('pack_templates', (table) => {
      table.dropColumn('homepage')
    })
    await knex.schema.dropTableIfExists('homepage')
  },
}
