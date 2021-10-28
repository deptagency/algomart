module.exports = {
  /**
   * @param {import('knex').Knex} knex
   */
  async up(knex) {
    await knex.schema
      .createTable('collections', (table) => {
        table.uuid('id').primary()
        table.string('status').defaultTo('draft').notNullable()
        table.integer('sort')
        table.uuid('user_created').references('id').inTable('directus_users')
        table.timestamp('date_created')
        table.uuid('user_updated').references('id').inTable('directus_users')
        table.timestamp('date_updated')
        table.string('slug').unique().notNullable()
        table
          .uuid('collection_image')
          .references('id')
          .inTable('directus_files')
      })
      .createTable('collections_translations', (table) => {
        table.increments('id')
        table.uuid('collections_id').references('id').inTable('collections')
        table.string('languages_code').references('code').inTable('languages')
        table.string('name').notNullable()
        table.string('description')
        table.json('metadata')
      })

    await knex('directus_collections').insert([
      {
        collection: 'collections',
        icon: 'folder_special',
        note: 'A collection of Sets or NFTs.',
        archive_field: 'status',
        archive_value: 'archived',
        unarchive_value: 'draft',
        sort_field: 'sort',
      },
      {
        collection: 'collections_translations',
        icon: 'import_export',
        hidden: true,
      },
    ])

    await knex('directus_fields').insert([
      {
        collection: 'collections',
        field: 'id',
        special: 'uuid',
        interface: 'input',
        readonly: true,
        hidden: true,
      },
      {
        collection: 'collections',
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
        collection: 'collections',
        field: 'sort',
        interface: 'input',
        hidden: true,
        width: 'half',
      },
      {
        collection: 'collections',
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
        collection: 'collections',
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
        collection: 'collections',
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
        collection: 'collections',
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
        collection: 'collections',
        field: 'slug',
        interface: 'input',
        options: { slug: true, trim: true },
        display: 'raw',
        width: 'half',
      },
      {
        collection: 'collections',
        field: 'collection_image',
        interface: 'file-image',
        display: 'image',
      },
      {
        collection: 'collections',
        field: 'translations',
        special: 'translations',
        interface: 'translations',
        options: {
          languageTemplate: '{{name}}',
          translationsTemplate: '{{name}}',
        },
      },
      {
        collection: 'collections',
        field: 'sets',
        special: 'o2m',
        interface: 'list-o2m',
        options: {
          enableCreate: false,
          enableSelect: true,
          template: '{{slug}}',
        },
      },
      {
        collection: 'collections',
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
        collection: 'collections_translations',
        field: 'id',
        interface: 'input',
        readonly: true,
        hidden: true,
      },
      {
        collection: 'collections_translations',
        field: 'collections_id',
        hidden: true,
      },
      {
        collection: 'collections_translations',
        field: 'languages_code',
        hidden: true,
      },
      {
        collection: 'collections_translations',
        field: 'name',
        interface: 'input',
        options: { trim: true },
        display: 'raw',
      },
      {
        collection: 'collections_translations',
        field: 'description',
        interface: 'input',
        options: { trim: true },
        display: 'raw',
      },
      {
        collection: 'collections_translations',
        field: 'metadata',
        special: 'json',
        interface: 'input-code',
        options: {
          template:
            '{\n  "size": {\n    "name": "Size",\n    "value": "18,240 SQFT"\n  },\n  "location": {\n    "name": "Location",\n    "value": "Vancouver"\n  }\n}',
          lineNumber: true,
          language: 'JSON',
        },
        display: 'raw',
      },
    ])

    await knex('directus_relations').insert([
      {
        many_collection: 'collections',
        many_field: 'user_created',
        one_collection: 'directus_users',
      },
      {
        many_collection: 'collections',
        many_field: 'user_updated',
        one_collection: 'directus_users',
      },
      {
        many_collection: 'collections',
        many_field: 'collection_image',
        one_collection: 'directus_files',
      },
      {
        many_collection: 'collections_translations',
        many_field: 'collections_id',
        one_collection: 'collections',
        one_field: 'translations',
        junction_field: 'languages_code',
      },
      {
        many_collection: 'collections_translations',
        many_field: 'languages_code',
        one_collection: 'languages',
        junction_field: 'collections_id',
      },
    ])
  },

  /**
   * @param {import('knex').Knex} knex
   */
  async down(knex) {
    await knex('directus_collections')
      .whereIn('collection', ['collections', 'collections_translations'])
      .delete()
    await knex('directus_fields')
      .whereIn('collection', ['collections', 'collections_translations'])
      .delete()
    await knex('directus_relations')
      .whereIn('many_collection', ['collections', 'collections_translations'])
      .delete()
    await knex.schema
      .dropTableIfExists('collections_translations')
      .dropTableIfExists('collections')
  },
}
