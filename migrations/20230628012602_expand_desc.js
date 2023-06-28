/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
  // Change the items table description from string to text
  return knex.schema.alterTable('items', table => {
    table.text('description').alter();
  });
}

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {
  return knex.schema.alterTable('items', table => {
    table.string('description').alter();
  });
};
