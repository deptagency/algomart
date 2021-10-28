const Currencies = require('@dinero.js/currencies')

module.exports = {
  /**
   * @param {import('knex').Knex} knex
   */
  async up(knex) {
    const choices = Object.keys(Currencies).map((key) => {
      return {
        text: Currencies[key].code,
        value: Currencies[key].code,
      }
    })
    // Currencies
    await knex.schema.createTable('application', (table) => {
      table.uuid('id').primary()
      table.string('currency').defaultTo('USD').unique().notNullable()
    })

    await knex('directus_collections').insert([
      {
        collection: 'application',
        icon: 'tune',
        note: 'Configure application.',
        singleton: true,
      },
    ])
    await knex('directus_fields').insert([
      {
        collection: 'application',
        field: 'id',
        special: 'uuid',
        readonly: true,
        hidden: true,
        interface: 'input',
      },
      {
        collection: 'application',
        field: 'currency',
        interface: 'select-dropdown',
        options: { choices },
        width: 'half',
      },
    ])
  },

  /**
   * @param {import('knex').Knex} knex
   */
  async down(knex) {
    await knex('directus_fields').where('collection', 'application').delete()
    await knex('directus_collections')
      .where('collection', 'application')
      .delete()
    await knex.schema.dropTableIfExists('application')
  },
}
