module.exports = {
  /**
   * @param {import('knex').Knex} knex
   */
  async up(knex) {
    await knex.schema.createTable('languages', (table) => {
      table.string('code').primary()
      table.string('name')
    })
    await knex('languages').insert({ code: 'en-US', name: 'English' })
    await knex('directus_collections').insert({
      collection: 'languages',
      icon: 'translate',
    })
    await knex('directus_fields').insert([
      {
        collection: 'languages',
        field: 'code',
        width: 'half',
        interface: 'input',
        options: { iconLeft: 'vpn_key' },
      },
      {
        collection: 'languages',
        field: 'name',
        width: 'half',
        interface: 'input',
        options: { iconLeft: 'translate' },
      },
    ])
  },

  /**
   * @param {import('knex').Knex} knex
   */
  async down(knex) {
    await knex('directus_fields').where('collection', 'languages').delete()
    await knex('directus_collections').where('collection', 'languages').delete()
    await knex.schema.dropTableIfExists('languages')
  },
}
