require('dotenv').config()

// Update with your config settings.

/**
 * @type { Object.<string, import("knex").Knex.Config> }
 */
module.exports = {

  development: {
    client: 'pg',
    connection: {
      host: process.env.DB_DEV_HOST,
      port: process.env.DB_DEV_PORT,
      user: process.env.DB_DEV_USER,
      password: process.env.DB_DEV_PW,
      database: process.env.DB_DEV_NAME
    }
  },

  staging: {
    client: 'pg',
    connection: {
      host: process.env.DB_STAGING_HOST,
      port: process.env.DB_STAGING_PORT,
      user: process.env.DB_STAGING_USER,
      password: process.env.DB_STAGING_PW,
      database: process.env.DB_STAGING_NAME
    },
    pool: {
      min: 2,
      max: 10
    },
    migrations: {
      tableName: 'knex_migrations'
    }
  },

  production: {
    client: 'pg',
    connection: {
      host: process.env.DB_PROD_HOST,
      port: process.env.DB_PROD_PORT,
      user: process.env.DB_PROD_USER,
      password: process.env.DB_PROD_PW,
      database: process.env.DB_PROD_NAME
    },
    pool: {
      min: 2,
      max: 10
    },
    migrations: {
      tableName: 'knex_migrations'
    }
  }

};
