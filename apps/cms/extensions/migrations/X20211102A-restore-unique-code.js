module.exports = {
  /**
   * @param {import('knex').Knex} knex
   */
  async up(knex) {
    await knex.schema.alterTable('nft_templates', (table) => {
      table.string('unique_code', 8).notNullable().alter()
    })
  },

  /**
   * @param {import('knex').Knex} knex
   */
  async down(knex) {
    await knex.schema.alterTable('nft_templates', (table) => {
      table.string('unique_code', 8).alter()
    })
  },
}
