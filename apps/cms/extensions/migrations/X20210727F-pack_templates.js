module.exports = {
  /**
   * @param {import('knex').Knex} knex
   */
  async up(knex) {
    await knex.schema
      .createTable('pack_templates', (table) => {
        table.uuid('id').primary()
        table.string('status').defaultTo('draft').notNullable()
        table.integer('sort')
        table.uuid('user_created').references('id').inTable('directus_users')
        table.timestamp('date_created')
        table.uuid('user_updated').references('id').inTable('directus_users')
        table.timestamp('date_updated')
        table.string('slug').unique().notNullable()
        table.string('type').notNullable()
        table.integer('price')
        table.timestamp('released_at')
        table.timestamp('auction_until')
        table.boolean('show_nfts').defaultTo(false).notNullable()
        table.string('nft_order').notNullable()
        table.string('nft_distribution').notNullable()
        table.integer('nfts_per_pack').notNullable()
        table
          .uuid('pack_image')
          .notNullable()
          .references('id')
          .inTable('directus_files')
      })
      .createTable('pack_templates_translations', (table) => {
        table.increments('id')
        table
          .uuid('pack_templates_id')
          .references('id')
          .inTable('pack_templates')
        table.string('languages_code').references('code').inTable('languages')
        table.string('title').notNullable()
        table.string('subtitle')
        table.text('body')
      })
      .createTable('pack_templates_directus_files', (table) => {
        table.increments('id')
        table
          .uuid('directus_files_id')
          .references('id')
          .inTable('directus_files')
        table
          .uuid('pack_templates_id')
          .references('id')
          .inTable('pack_templates')
        table.integer('sort')
      })

    await knex('directus_collections').insert([
      {
        collection: 'pack_templates',
        icon: 'dashboard',
        note: 'Template for generating packs.',
        archive_field: 'status',
        archive_value: 'archived',
        unarchive_value: 'draft',
        sort_field: 'sort',
      },
      {
        collection: 'pack_templates_translations',
        icon: 'import_export',
        hidden: true,
      },
      {
        collection: 'pack_templates_directus_files',
        icon: 'import_export',
        hidden: true,
      },
    ])

    await knex('directus_fields').insert([
      {
        collection: 'pack_templates',
        field: 'id',
        special: 'uuid',
        interface: 'input',
        readonly: true,
        hidden: true,
      },
      {
        collection: 'pack_templates',
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
        collection: 'pack_templates',
        field: 'sort',
        interface: 'input',
        hidden: true,
        width: 'half',
      },
      {
        collection: 'pack_templates',
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
        collection: 'pack_templates',
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
        collection: 'pack_templates',
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
        collection: 'pack_templates',
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
        collection: 'pack_templates',
        field: 'slug',
        interface: 'input',
        options: { trim: true, slug: true },
        display: 'raw',
        width: 'half',
      },
      {
        collection: 'pack_templates',
        field: 'released_at',
        interface: 'datetime',
        display: 'datetime',
        width: 'half',
      },
      {
        collection: 'pack_templates',
        field: 'price',
        interface: 'price',
        options: { min: 0, iconLeft: 'attach_money' },
        display: 'price',
        width: 'half',
        note: 'Price in application currency. For auctions, this is the initial asking price.',
      },
      {
        collection: 'pack_templates',
        field: 'type',
        interface: 'select-dropdown',
        options: {
          choices: [
            { text: 'Free', value: 'free' },
            { text: 'Redeem', value: 'redeem' },
            { text: 'Purchase', value: 'purchase' },
            { text: 'Auction', value: 'auction' },
          ],
        },
        display: 'labels',
        width: 'half',
      },
      {
        collection: 'pack_templates',
        field: 'show_nfts',
        special: 'boolean',
        display: 'boolean',
        display_options: { labelOn: 'Showing NFTs', labelOff: 'Hiding NFTs' },
        translations: JSON.stringify([
          { language: 'en-US', translation: 'Show NFTs' },
        ]),
        note: 'When enabled, NFTs contained in this pack will be visible before purchase.',
        width: 'half',
      },
      {
        collection: 'pack_templates',
        field: 'nft_order',
        interface: 'select-dropdown',
        options: {
          choices: [
            { text: 'Match', value: 'match' },
            { text: 'Random', value: 'random' },
          ],
        },
        display: 'labels',
        translations: JSON.stringify([
          { language: 'en-US', translation: 'NFT Order' },
        ]),
        note: 'Should NFT and Pack minting order match or be random?',
        width: 'half',
      },
      {
        collection: 'pack_templates',
        field: 'nft_distribution',
        interface: 'select-dropdown',
        options: {
          choices: [
            { text: 'One of each', value: 'one-of-each' },
            { text: 'Random, no duplicates', value: 'random' },
          ],
        },
        display: 'labels',
        translations: JSON.stringify([
          { language: 'en-US', translation: 'NFT Distribution' },
        ]),
        note: 'Should one of each NFT be included in every pack or a random selection?',
        width: 'half',
      },
      {
        collection: 'pack_templates',
        field: 'nfts_per_pack',
        interface: 'input',
        options: { min: '1' },
        display: 'raw',
        translations: JSON.stringify([
          { language: 'en-US', translation: 'NFTs per pack' },
        ]),
        note: 'Number of NFTs contained in a single pack.',
        width: 'half',
      },
      {
        collection: 'pack_templates',
        field: 'auction_until',
        interface: 'datetime',
        display: 'datetime',
        width: 'half',
        note: 'Auction this pack until this date and time.',
      },
      {
        collection: 'pack_templates',
        field: 'pack_image',
        interface: 'file-image',
        display: 'image',
        note: 'Primary image shown for this pack.',
      },
      {
        collection: 'pack_templates',
        field: 'translations',
        special: 'translations',
        interface: 'translations',
        options: {
          languageTemplate: '{{name}}',
          translationsTemplate: '{{title}}',
        },
      },
      {
        collection: 'pack_templates',
        field: 'nft_templates',
        special: 'o2m',
        interface: 'list-o2m',
        options: { enableCreate: false, template: '{{unique_code}}' },
        translations: JSON.stringify([
          { language: 'en-US', translation: 'NFT Templates' },
        ]),
      },
      {
        collection: 'pack_templates',
        field: 'additional_images',
        special: 'files',
        interface: 'list-m2m',
        note: 'Optional, additional preview images & files shown on the pack page.',
      },
      {
        collection: 'pack_templates_translations',
        field: 'id',
        interface: 'input',
        readonly: true,
        hidden: true,
      },
      {
        collection: 'pack_templates_translations',
        field: 'pack_templates_id',
        hidden: true,
      },
      {
        collection: 'pack_templates_translations',
        field: 'languages_code',
        hidden: true,
      },
      {
        collection: 'pack_templates_translations',
        field: 'title',
        interface: 'input',
        options: { trim: true },
        display: 'raw',
      },
      {
        collection: 'pack_templates_translations',
        field: 'subtitle',
        interface: 'input',
        options: { trim: true },
        display: 'raw',
      },
      {
        collection: 'pack_templates_translations',
        field: 'body',
        interface: 'input-rich-text-md',
        display: 'formatted-value',
      },
      {
        collection: 'pack_templates_directus_files',
        field: 'id',
        interface: 'input',
        readonly: true,
        hidden: true,
      },
      {
        collection: 'pack_templates_directus_files',
        field: 'pack_templates_id',
        hidden: true,
      },
      {
        collection: 'pack_templates_directus_files',
        field: 'directus_files_id',
        hidden: true,
      },
      {
        collection: 'pack_templates_directus_files',
        field: 'sort',
        hidden: true,
      },
    ])

    await knex('directus_relations').insert([
      {
        many_collection: 'pack_templates',
        many_field: 'pack_image',
        one_collection: 'directus_files',
      },
      {
        many_collection: 'pack_templates',
        many_field: 'user_created',
        one_collection: 'directus_users',
      },
      {
        many_collection: 'pack_templates',
        many_field: 'user_updated',
        one_collection: 'directus_users',
      },
      {
        many_collection: 'pack_templates_translations',
        many_field: 'pack_templates_id',
        one_collection: 'pack_templates',
        one_field: 'translations',
        junction_field: 'languages_code',
      },
      {
        many_collection: 'pack_templates_translations',
        many_field: 'languages_code',
        one_collection: 'languages',
        junction_field: 'pack_templates_id',
      },
      {
        many_collection: 'pack_templates_directus_files',
        many_field: 'pack_templates_id',
        one_collection: 'pack_templates',
        one_field: 'additional_images',
        junction_field: 'directus_files_id',
        sort_field: 'sort',
      },
      {
        many_collection: 'pack_templates_directus_files',
        many_field: 'directus_files_id',
        one_collection: 'directus_files',
        junction_field: 'pack_templates_id',
      },
    ])
  },

  /**
   * @param {import('knex').Knex} knex
   */
  async down(knex) {
    await knex('directus_collections')
      .whereIn('collection', [
        'pack_templates',
        'pack_templates_translations',
        'pack_templates_directus_files',
      ])
      .delete()

    await knex('directus_fields')
      .whereIn('collection', [
        'pack_templates',
        'pack_templates_translations',
        'pack_templates_directus_files',
      ])
      .delete()

    await knex('directus_relations')
      .whereIn('many_collection', [
        'pack_templates',
        'pack_templates_translations',
        'pack_templates_directus_files',
      ])
      .delete()

    await knex.schema
      .dropTableIfExists('pack_templates_translations')
      .dropTableIfExists('pack_templates_directus_files')
      .dropTableIfExists('pack_templates')
  },
}
