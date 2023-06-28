# Initial set up

## Prerequisites

This project uses a postgres database for item, user, and session storage.
You must create a postgres database and add the environment variables to the .env file.

## Clone the repo

```
git clone git@github.com:neg-0/crud-app-server.git
```

## Install dependencies

```
npm install
```

## Create the session table

```
CREATE TABLE IF NOT EXISTS "session" (
  "sid" varchar NOT NULL COLLATE "default",
	"sess" json NOT NULL,
	"expire" timestamp(6) NOT NULL
)
WITH (OIDS=FALSE);
ALTER TABLE "session" ADD CONSTRAINT "session_pkey" PRIMARY KEY ("sid") NOT DEFERRABLE INITIALLY IMMEDIATE;
```

## Run knex migrations

```
npm i -g knex
knex migrate:latest
```

## Seed the database

```
knex seed:run
```

## Create a .env file in the root directory

```
touch .env
```

## Add the following environment variables to the .env file

```
DB_DEV_HOST=
DB_DEV_PORT=
DB_DEV_USER=
DB_DEV_PW=
DB_DEV_NAME=

DB_STAGING_HOST=
DB_STAGING_PORT=
DB_STAGING_USER=
DB_STAGING_PW=
DB_STAGING_NAME=

DB_PROD_HOST=
DB_PROD_PORT=
DB_PROD_USER=
DB_PROD_PW=
DB_PROD_NAME=

SESSION_SECRET=

NODE_ENV=development
```

## Run the app

```
npm start dev
```
