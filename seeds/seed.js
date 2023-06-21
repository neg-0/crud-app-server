const faker = require('@faker-js/faker').faker;

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> } 
 */
exports.seed = async function (knex) {
  await knex('users').del()
  await knex('users').insert(faker.helpers.multiple(createRandomUser, { count: 10 }));
  const userIds = await knex('users').pluck('id');
  await knex('items').del()
  await knex('items').insert(faker.helpers.multiple(() => createRandomItem(userIds), { count: 100 }))
};

function createRandomUser() {
  return {
    first_name: faker.person.firstName(),
    last_name: faker.person.lastName(),
    username: faker.internet.userName(),
    password: faker.internet.password()
  }
}

function createRandomItem(userIds) {
  return {
    item_name: faker.commerce.productName(),
    description: faker.commerce.productDescription(),
    quantity: faker.number.int({ min: 1, max: 100 }),
    user_id: faker.helpers.arrayElement(userIds)
  }
}