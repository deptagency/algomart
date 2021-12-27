module.exports = {
  /**
   * @param {import('knex').Knex} knex
   */
  async up(knex) {
    await knex.schema
      .createTable('brands', (table) => {
        table.uuid('id').primary()
        table.string('slug').unique().notNullable()
        table.uuid('logo').references('id').inTable('directus_files')
        table.uuid('banner').references('id').inTable('directus_files')
        table.string('status').defaultTo('draft').notNullable()
        table.integer('sort')
        table.uuid('user_created').references('id').inTable('directus_users')
        table.timestamp('date_created')
        table.uuid('user_updated').references('id').inTable('directus_users')
        table.timestamp('date_updated')
      })
      .createTable('brands_translations', (table) => {
        table.increments('id')
        table.uuid('brands_id').references('id').inTable('brands')
        table.string('languages_code').references('code').inTable('languages')
        table.string('name').notNullable()
      })

    await knex.schema.alterTable('pack_templates', (table) => {
      table.uuid('brand').references('id').inTable('brands')
    })

    await knex('directus_collections').insert([
      {
        collection: 'brands',
        icon: 'storefront',
        note: 'A brand, artist, or any other source of of NFTs.',
        archive_field: 'status',
        archive_value: 'archived',
        unarchive_value: 'draft',
        sort_field: 'sort',
      },
      {
        collection: 'brands_translations',
        icon: 'translate',
        hidden: true,
      },
    ])

    await knex('directus_fields').insert([
      {
        collection: 'brands',
        field: 'id',
        special: 'uuid',
        interface: 'input',
        readonly: true,
        hidden: true,
      },
      {
        collection: 'brands',
        field: 'slug',
        interface: 'input',
        options: { slug: true, trim: true },
        display: 'raw',
      },
      {
        collection: 'brands',
        field: 'logo',
        interface: 'file-image',
        display: 'image',
        note: 'Brand logo. (330x200)',
      },
      {
        collection: 'brands',
        field: 'banner',
        interface: 'file-image',
        display: 'image',
        note: 'Brand banner image. (1060x200)',
      },
      {
        collection: 'brands',
        field: 'pack_templates',
        special: 'o2m',
        interface: 'list-o2m',
        options: {
          enableCreate: false,
          enableSelect: true,
          template: '{{unique_code}}',
        },
        translations: JSON.stringify([
          { language: 'en-US', translation: 'Pack Templates' },
        ]),
      },
      {
        collection: 'brands',
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
        collection: 'brands',
        field: 'sort',
        interface: 'input',
        // hidden: true,
        width: 'half',
      },
      {
        collection: 'brands',
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
        collection: 'brands',
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
        collection: 'brands',
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
        collection: 'brands',
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
        collection: 'brands',
        field: 'translations',
        special: 'translations',
        interface: 'translations',
        options: {
          languageTemplate: '{{name}}',
          translationsTemplate: '{{name}}',
        },
      },
      {
        collection: 'brands_translations',
        field: 'id',
        interface: 'input',
        readonly: true,
        hidden: true,
      },
      {
        collection: 'brands_translations',
        field: 'brands_id',
        hidden: true,
      },
      {
        collection: 'brands_translations',
        field: 'languages_code',
        hidden: true,
      },
      {
        collection: 'brands_translations',
        field: 'name',
        interface: 'input',
        options: { trim: true },
        display: 'raw',
      },
      // NFT Templates Fields
      {
        collection: 'pack_templates',
        field: 'brand',
        special: 'm2o',
        interface: 'select-dropdown-m2o',
        options: { template: '{{slug}}' },
        display: 'related-values',
        display_options: { template: '{{slug}}' },
        width: 'half',
      },
    ])

    await knex('directus_relations').insert([
      {
        many_collection: 'brands',
        many_field: 'user_created',
        one_collection: 'directus_users',
      },
      {
        many_collection: 'brands',
        many_field: 'user_updated',
        one_collection: 'directus_users',
      },
      {
        many_collection: 'brands_translations',
        many_field: 'brands_id',
        one_collection: 'brands',
        one_field: 'translations',
        junction_field: 'languages_code',
      },
      {
        many_collection: 'brands_translations',
        many_field: 'languages_code',
        one_collection: 'languages',
        junction_field: 'brands_id',
      },
      {
        many_collection: 'pack_templates',
        many_field: 'brand',
        one_collection: 'brands',
        one_field: 'pack_templates',
      },
    ])
  },

  /**
   * @param {import('knex').Knex} knex
   */
  async down(knex) {
    await knex('directus_collections')
      .whereIn('collection', ['brands', 'brands_translations'])
      .delete()
    await knex.schema.alterTable('pack_templates', (table) => {
      table.dropColumn('brand')
    })
    await knex('directus_fields')
      .whereIn('collection', ['brands', 'brands_translations'])
      .delete()
    await knex('directus_fields').whereIn('field', ['brand']).delete()
    await knex('directus_relations')
      .whereIn('many_collection', ['brands', 'brands_translations'])
      .delete()
    await knex('directus_relations')
      .whereIn('one_collection', ['brands'])
      .delete()
    await knex.schema
      .dropTableIfExists('brands_translations')
      .dropTableIfExists('brands')
  },
}
