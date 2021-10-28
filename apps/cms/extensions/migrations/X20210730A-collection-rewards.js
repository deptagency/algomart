module.exports = {
  /**
   * @param {import('knex').Knex} knex
   */
  async up(knex) {
    await knex.schema.table('collections', (table) => {
      table.uuid('reward_image').references('id').inTable('directus_files')
    })
    await knex.schema.table('collections_translations', (table) => {
      table.string('reward_prompt')
      table.string('reward_complete')
    })
    await knex('directus_fields').insert([
      {
        collection: 'collections',
        field: 'reward_image',
        interface: 'file-image',
        display: 'image',
        note: 'Image shown if there is a reward for collecting all collectibles in a collection.',
      },
      {
        collection: 'collections_translations',
        field: 'reward_prompt',
        interface: 'input-code',
        options: { language: 'markdown' },
        display: 'formatted-value',
        note: 'If there is a reward, this is the text shown to prompt a user to collect every collectible in the collection.',
      },
      {
        collection: 'collections_translations',
        field: 'reward_complete',
        interface: 'input-code',
        options: { language: 'markdown' },
        display: 'formatted-value',
        note: 'If a reward is prompted, this is the text to show upon collecting every collectible in the collection.',
      },
    ])
    await knex('directus_relations').insert([
      {
        many_collection: 'collections',
        many_field: 'reward_image',
        one_collection: 'directus_files',
      },
    ])
  },

  /**
   * @param {import('knex').Knex} knex
   */
  async down(knex) {
    await knex('directus_fields')
      .where('collection', 'collections')
      .whereIn('field', ['reward_image'])
      .delete()
    await knex('directus_fields')
      .where('collection', 'collections_translations')
      .whereIn('field', ['reward_prompt', 'reward_complete'])
      .delete()
    await knex('directus_relations')
      .where({
        many_collection: 'collections',
        many_field: 'reward_image',
        one_collection: 'directus_files',
      })
      .delete()
    await knex.schema.table('collections', (table) => {
      table.dropColumns(['reward_image'])
    })
    await knex.schema.table('collections_translations', (table) => {
      table.dropColumns(['reward_prompt', 'reward_complete'])
    })
  },
}
