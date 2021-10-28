module.exports = {
  /**
   * @param {import('knex').Knex} knex
   */
  async up(knex) {
    await knex.schema
      .createTable('rarities', (table) => {
        table.uuid('id').primary()
        table.uuid('user_created').references('id').inTable('directus_users')
        table.timestamp('date_created')
        table.uuid('user_updated').references('id').inTable('directus_users')
        table.timestamp('date_updated')
        table.string('code', 2).notNullable()
        table.string('color').notNullable()
      })
      .createTable('rarities_translations', (table) => {
        table.increments('id')
        table.uuid('rarities_id').references('id').inTable('rarities')
        table.string('languages_code').references('code').inTable('languages')
        table.string('name').notNullable()
      })
    await knex('directus_collections').insert([
      {
        collection: 'rarities',
        icon: 'star_rate',
        note: 'Rarity level.',
        translations: JSON.stringify([
          {
            language: 'en-US',
            translation: 'Rarities',
            singular: 'Rarity',
            plural: 'Rarities',
          },
        ]),
      },
      {
        collection: 'rarities_translations',
        icon: 'import_export',
        hidden: true,
      },
    ])
    await knex('directus_fields').insert([
      {
        collection: 'rarities',
        field: 'id',
        special: 'uuid',
        readonly: true,
        hidden: true,
        interface: 'input',
      },
      {
        collection: 'rarities',
        field: 'user_created',
        special: 'user-created',
        interface: 'select-dropdown-m2o',
        options: {
          template: '{{avatar.$thumbnail}} {{first_name}} {{last_name}}',
        },
        display: 'user',
        readonly: true,
        hidden: true,
        width: 'half',
      },
      {
        collection: 'rarities',
        field: 'date_created',
        special: 'date-created',
        interface: 'datetime',
        display: 'datetime',
        display_options: { relative: true },
        readonly: true,
        hidden: true,
        width: 'half',
      },
      {
        collection: 'rarities',
        field: 'user_updated',
        special: 'user-updated',
        interface: 'select-dropdown-m2o',
        options: {
          template: '{{avatar.$thumbnail}} {{first_name}} {{last_name}}',
        },
        display: 'user',
        readonly: true,
        hidden: true,
        width: 'half',
      },
      {
        collection: 'rarities',
        field: 'date_updated',
        special: 'date-updated',
        interface: 'datetime',
        display: 'datetime',
        display_options: { relative: true },
        readonly: true,
        hidden: true,
        width: 'half',
      },
      {
        collection: 'rarities',
        field: 'code',
        interface: 'input',
        display: 'raw',
        options: { trim: true },
        width: 'half',
      },
      {
        collection: 'rarities',
        field: 'color',
        interface: 'select-color',
        display: 'color',
        width: 'half',
      },
      {
        collection: 'rarities',
        field: 'translations',
        interface: 'translations',
        special: 'translations',
        options: {
          languageTemplate: '{{name}}',
          translationsTemplate: '{{name}}',
        },
      },
      {
        collection: 'rarities_translations',
        field: 'id',
        interface: 'input',
        readonly: true,
        hidden: true,
      },
      {
        collection: 'rarities_translations',
        field: 'rarities_id',
        hidden: true,
      },
      {
        collection: 'rarities_translations',
        field: 'languages_code',
        hidden: true,
      },
      {
        collection: 'rarities_translations',
        field: 'name',
        interface: 'input',
        options: { trim: true },
        display: 'raw',
      },
    ])

    await knex('directus_relations').insert([
      {
        many_collection: 'rarities',
        many_field: 'user_created',
        one_collection: 'directus_users',
      },
      {
        many_collection: 'rarities',
        many_field: 'user_updated',
        one_collection: 'directus_users',
      },
      {
        many_collection: 'rarities_translations',
        many_field: 'rarities_id',
        one_collection: 'rarities',
        one_field: 'translations',
        junction_field: 'languages_code',
      },
      {
        many_collection: 'rarities_translations',
        many_field: 'languages_code',
        one_collection: 'languages',
        junction_field: 'rarities_id',
      },
    ])
  },

  /**
   * @param {import('knex').Knex} knex
   */
  async down(knex) {
    await knex('directus_fields')
      .whereIn('collection', ['rarities', 'rarities_translations'])
      .delete()
    await knex('directus_collections')
      .whereIn('collection', ['rarities', 'rarities_translations'])
      .delete()
    await knex('directus_relations')
      .whereIn('many_collection', ['rarities', 'rarities_translations'])
      .delete()
    await knex.schema
      .dropTableIfExists('rarities_translations')
      .dropTableIfExists('rarities')
  },
}
