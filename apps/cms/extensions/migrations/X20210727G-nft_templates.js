module.exports = {
  /**
   * @param {import('knex').Knex} knex
   */
  async up(knex) {
    await knex.schema
      .createTable('nft_templates', (table) => {
        table.uuid('id').primary()
        table.string('status').defaultTo('draft').notNullable()
        table.uuid('user_created').references('id').inTable('directus_users')
        table.timestamp('date_created')
        table.uuid('user_updated').references('id').inTable('directus_users')
        table.timestamp('date_updated')
        table.integer('total_editions').notNullable()
        table.string('unique_code').unique().notNullable()
        table
          .uuid('preview_image')
          .notNullable()
          .references('id')
          .inTable('directus_files')
        table.uuid('preview_video').references('id').inTable('directus_files')
        table.uuid('preview_audio').references('id').inTable('directus_files')
        table.uuid('asset_file').references('id').inTable('directus_files')
        table.uuid('pack_template').references('id').inTable('pack_templates')
        table.uuid('rarity').references('id').inTable('rarities')
        table.uuid('set').references('id').inTable('sets')
        table.uuid('collection').references('id').inTable('collections')
      })
      .createTable('nft_templates_translations', (table) => {
        table.increments('id')
        table.uuid('nft_templates_id').references('id').inTable('nft_templates')
        table.string('languages_code').references('code').inTable('languages')
        table.string('title').notNullable()
        table.string('subtitle')
        table.text('body')
      })

    await knex('directus_collections').insert([
      {
        collection: 'nft_templates',
        icon: 'image',
        note: 'Template for generating NFTs.',
        archive_field: 'status',
        archive_value: 'archived',
        unarchive_value: 'draft',
        translations: JSON.stringify([
          {
            language: 'en-US',
            translation: 'NFT Templates',
            singular: 'NFT Template',
            plural: 'NFT Templates',
          },
        ]),
      },
      {
        collection: 'nft_templates_translations',
        icon: 'import_export',
        hidden: true,
        translations: JSON.stringify([
          {
            language: 'en-US',
            translation: 'NFT Template Translations',
            singular: 'NFT Template Translation',
            plural: 'NFT Template Translations',
          },
        ]),
      },
    ])

    await knex('directus_fields').insert([
      {
        collection: 'nft_templates',
        field: 'id',
        special: 'uuid',
        interface: 'input',
        readonly: true,
        hidden: true,
      },
      {
        collection: 'nft_templates',
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
        width: 'half',
        display_options: {
          showAsDot: true,
          choices: [
            { background: '#00C897', value: 'published' },
            { background: '#D3DAE4', value: 'draft' },
            { background: '#F7971C', value: 'archived' },
          ],
        },
      },
      {
        collection: 'nft_templates',
        field: 'user_created',
        special: 'user-created',
        width: 'half',
        interface: 'select-dropdown-m2o',
        options: {
          template: '{{avatar.$thumbnail}} {{first_name}} {{last_name}}',
        },
        display: 'user',
        readonly: true,
        hidden: true,
      },
      {
        collection: 'nft_templates',
        field: 'date_created',
        special: 'date-created',
        width: 'half',
        interface: 'datetime',
        display: 'datetime',
        display_options: { relative: true },
        readonly: true,
        hidden: true,
      },
      {
        collection: 'nft_templates',
        field: 'user_updated',
        special: 'user-updated',
        width: 'half',
        interface: 'select-dropdown-m2o',
        options: {
          template: '{{avatar.$thumbnail}} {{first_name}} {{last_name}}',
        },
        display: 'user',
        readonly: true,
        hidden: true,
      },
      {
        collection: 'nft_templates',
        field: 'date_updated',
        special: 'date-updated',
        width: 'half',
        interface: 'datetime',
        display: 'datetime',
        display_options: { relative: true },
        readonly: true,
        hidden: true,
      },
      {
        collection: 'nft_templates',
        field: 'total_editions',
        interface: 'input',
        display: 'raw',
        options: { min: '1' },
        width: 'half',
      },
      {
        collection: 'nft_templates',
        field: 'unique_code',
        interface: 'input',
        options: { trim: true },
        width: 'half',
      },
      {
        collection: 'nft_templates',
        field: 'preview_image',
        interface: 'file-image',
        display: 'image',
      },
      {
        collection: 'nft_templates',
        field: 'preview_video',
        interface: 'file',
        display: 'file',
      },
      {
        collection: 'nft_templates',
        field: 'preview_audio',
        interface: 'file',
        display: 'file',
      },
      {
        collection: 'nft_templates',
        field: 'asset_file',
        interface: 'file',
        display: 'file',
      },
      {
        collection: 'nft_templates',
        field: 'pack_template',
        special: 'm2o',
        interface: 'select-dropdown-m2o',
        options: { template: '{{slug}}' },
        display: 'related-values',
        display_options: { template: '{{slug}}' },
        width: 'half',
      },
      {
        collection: 'nft_templates',
        field: 'rarity',
        interface: 'select-dropdown-m2o',
        options: { template: '{{code}}' },
        display: 'related-values',
        display_options: { template: '{{code}}' },
        width: 'half',
      },
      {
        collection: 'nft_templates',
        field: 'set',
        special: 'm2o',
        interface: 'select-dropdown-m2o',
        options: { template: '{{slug}}' },
        display: 'related-values',
        display_options: { template: '{{slug}}' },
        width: 'half',
      },
      {
        collection: 'nft_templates',
        field: 'collection',
        special: 'm2o',
        interface: 'select-dropdown-m2o',
        options: { template: '{{slug}}' },
        display: 'related-values',
        display_options: { template: '{{slug}}' },
        width: 'half',
      },
      {
        collection: 'nft_templates',
        field: 'translations',
        special: 'translations',
        interface: 'translations',
        options: {
          languageTemplate: '{{name}}',
          translationsTemplate: '{{title}}',
        },
      },
      {
        collection: 'nft_templates_translations',
        field: 'id',
        interface: 'input',
        readonly: true,
        hidden: true,
      },
      {
        collection: 'nft_templates_translations',
        field: 'nft_templates_id',
        hidden: true,
      },
      {
        collection: 'nft_templates_translations',
        field: 'languages_code',
        hidden: true,
      },
      {
        collection: 'nft_templates_translations',
        field: 'title',
        interface: 'input',
        options: { trim: true },
        display: 'raw',
      },
      {
        collection: 'nft_templates_translations',
        field: 'subtitle',
        interface: 'input',
        options: { trim: true },
        display: 'raw',
      },
      {
        collection: 'nft_templates_translations',
        field: 'body',
        interface: 'input-rich-text-md',
        display: 'formatted-value',
      },
    ])

    await knex('directus_relations').insert([
      {
        many_collection: 'nft_templates',
        many_field: 'user_created',
        one_collection: 'directus_users',
      },
      {
        many_collection: 'nft_templates',
        many_field: 'user_updated',
        one_collection: 'directus_users',
      },
      {
        many_collection: 'nft_templates',
        many_field: 'pack_template',
        one_collection: 'pack_templates',
        one_field: 'nft_templates',
      },
      {
        many_collection: 'nft_templates',
        many_field: 'set',
        one_collection: 'sets',
        one_field: 'nft_templates',
      },
      {
        many_collection: 'nft_templates',
        many_field: 'collection',
        one_collection: 'collections',
        one_field: 'nft_templates',
      },
      {
        many_collection: 'nft_templates',
        many_field: 'rarity',
        one_collection: 'rarities',
        one_field: 'nft_templates',
      },
      {
        many_collection: 'nft_templates',
        many_field: 'preview_image',
        one_collection: 'directus_files',
      },
      {
        many_collection: 'nft_templates',
        many_field: 'preview_video',
        one_collection: 'directus_files',
      },
      {
        many_collection: 'nft_templates',
        many_field: 'preview_audio',
        one_collection: 'directus_files',
      },
      {
        many_collection: 'nft_templates_translations',
        many_field: 'languages_code',
        one_collection: 'languages',
        junction_field: 'nft_templates_id',
      },
      {
        many_collection: 'nft_templates_translations',
        many_field: 'nft_templates_id',
        one_collection: 'nft_templates',
        one_field: 'translations',
        junction_field: 'languages_code',
      },
    ])
  },

  /**
   * @param {import('knex').Knex} knex
   */
  async down(knex) {
    await knex('directus_collections')
      .whereIn('collection', ['nft_templates', 'nft_templates_translations'])
      .delete()

    await knex('directus_fields')
      .whereIn('collection', ['nft_templates', 'nft_templates_translations'])
      .delete()

    await knex('directus_relations')
      .whereIn('many_collection', [
        'nft_templates',
        'nft_templates_translations',
      ])
      .delete()

    await knex.schema
      .dropTableIfExists('nft_templates_translations')
      .dropTableIfExists('nft_templates')
  },
}
