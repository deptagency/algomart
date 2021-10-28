module.exports = {
  /**
   * @param {import('knex').Knex} knex
   */
  async up(knex) {
    await knex.schema
      .createTable('sets', (table) => {
        table.uuid('id').primary()
        table.string('status').defaultTo('draft').notNullable()
        table.integer('sort')
        table.uuid('user_created').references('id').inTable('directus_users')
        table.timestamp('date_created')
        table.uuid('user_updated').references('id').inTable('directus_users')
        table.timestamp('date_updated')
        table.string('slug').unique().notNullable()
        table
          .uuid('collection')
          .notNullable()
          .references('id')
          .inTable('collections')
      })
      .createTable('sets_translations', (table) => {
        table.increments('id')
        table.uuid('sets_id').references('id').inTable('sets')
        table.string('languages_code').references('code').inTable('languages')
        table.string('name').notNullable()
      })

    await knex('directus_collections').insert([
      {
        collection: 'sets',
        icon: 'collections',
        note: 'A set of NFTs.',
        archive_field: 'status',
        archive_value: 'archived',
        unarchive_value: 'draft',
        sort_field: 'sort',
      },
      {
        collection: 'sets_translations',
        icon: 'import_export',
        hidden: true,
      },
    ])

    await knex('directus_fields').insert([
      {
        collection: 'sets',
        field: 'id',
        special: 'uuid',
        interface: 'input',
        readonly: true,
        hidden: true,
      },
      {
        collection: 'sets',
        field: 'status',
        interface: 'select-dropdown',
        options: {
          choices: [
            { text: 'Published', value: 'published' },
            { text: 'Draft', value: 'draft' },
            { text: 'Archived', value: 'archived' },
          ],
        },
        display: 'labels',
        display_options: {
          showAsDot: true,
          choices: [
            { background: '#00C897', value: 'published' },
            { background: '#D3DAE4', value: 'draft' },
            { background: '#F7971C', value: 'archived' },
          ],
        },
        width: 'half',
      },
      {
        collection: 'sets',
        field: 'sort',
        interface: 'input',
        hidden: true,
        width: 'half',
      },
      {
        collection: 'sets',
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
        collection: 'sets',
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
        collection: 'sets',
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
        collection: 'sets',
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
        collection: 'sets',
        field: 'slug',
        interface: 'input',
        options: { slug: true, trim: true },
        display: 'raw',
        width: 'half',
      },
      {
        collection: 'sets',
        field: 'collection',
        special: 'm2o',
        interface: 'select-dropdown-m2o',
        options: { template: '{{slug}}' },
        display: 'related-values',
        display_options: { template: '{{slug}}' },
        width: 'half',
      },
      {
        collection: 'sets',
        field: 'nft_templates',
        special: 'o2m',
        interface: 'list-o2m',
        options: {
          enableCreate: false,
          enableSelect: true,
          template: '{{unique_code}}',
        },
        translations: JSON.stringify([
          { language: 'en-US', translation: 'NFT Templates' },
        ]),
      },
      {
        collection: 'sets',
        field: 'translations',
        special: 'translations',
        interface: 'translations',
        options: {
          languageTemplate: '{{name}}',
          translationsTemplate: '{{name}}',
        },
      },
      {
        collection: 'sets_translations',
        field: 'id',
        interface: 'input',
        readonly: true,
        hidden: true,
      },
      {
        collection: 'sets_translations',
        field: 'sets_id',
        hidden: true,
      },
      {
        collection: 'sets_translations',
        field: 'languages_code',
        hidden: true,
      },
      {
        collection: 'sets_translations',
        field: 'name',
        interface: 'input',
        options: { trim: true },
        display: 'raw',
      },
    ])

    await knex('directus_relations').insert([
      {
        many_collection: 'sets',
        many_field: 'user_created',
        one_collection: 'directus_users',
      },
      {
        many_collection: 'sets',
        many_field: 'user_updated',
        one_collection: 'directus_users',
      },
      {
        many_collection: 'sets',
        many_field: 'collection',
        one_collection: 'collections',
        one_field: 'sets',
      },
      {
        many_collection: 'sets_translations',
        many_field: 'sets_id',
        one_collection: 'sets',
        one_field: 'translations',
        junction_field: 'languages_code',
      },
      {
        many_collection: 'sets_translations',
        many_field: 'languages_code',
        one_collection: 'languages',
        junction_field: 'sets_id',
      },
    ])
  },

  /**
   * @param {import('knex').Knex} knex
   */
  async down(knex) {
    await knex('directus_collections')
      .whereIn('collection', ['sets', 'sets_translations'])
      .delete()
    await knex('directus_fields')
      .whereIn('collection', ['sets', 'sets_translations'])
      .delete()
    await knex('directus_relations')
      .whereIn('many_collection', ['sets', 'sets_translations'])
      .delete()
    await knex.schema.dropTableIfExists('sets')
  },
}
