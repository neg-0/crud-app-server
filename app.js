require('dotenv').config()
const express = require('express')
const cookieParser = require("cookie-parser");
const session = require('express-session')
const pg = require('pg');
const pgSession = require('connect-pg-simple')(session);
const cors = require('cors');
const app = express()
const port = 3000

const bcrypt = require('bcryptjs');
const SALT_ROUNDS = 10;

const knex = require('knex')({
  client: 'pg',
  connection: {
    host: process.env.DB_DEV_HOST,
    port: process.env.DB_DEV_PORT,
    user: process.env.DB_DEV_USER,
    password: process.env.DB_DEV_PW,
    database: process.env.DB_DEV_NAME
  }
});

const pgPool = new pg.Pool({
  // Insert your Postgres config here
  user: process.env.DB_DEV_USER,
  host: process.env.DB_DEV_HOST,
  database: process.env.DB_DEV_NAME,
  password: process.env.DB_DEV_PW,
  port: process.env.DB_DEV_PORT,
});

app.use(express.json());
app.use(cookieParser());
app.use(cors({
  origin: 'http://localhost:5173',
  credentials: true
}));

const oneDay = 1000 * 60 * 60 * 24;

if (!process.env.SESSION_SECRET) {
  console.error('SESSION_SECRET not set');
  process.exit(1);
}

app.set('trust proxy', 1);

app.use(session({
  store: new pgSession({
    pool: pgPool,                // Connection pool
    tableName: 'session'   // Use another table-name than the default "session" one
  }),
  secret: process.env.SESSION_SECRET,
  saveUninitialized: false,
  cookie: { secure: false, maxAge: oneDay },
  resave: false
}));

app.listen(port, () => {
  console.log(`CRUD app listening on port ${port}`)
})

/**
 * Gets the current user if authenticated
 */
app.get('/user', isAuthenticated, async (req, res) => {
  const { userId } = req.session;
  const [user] = await knex('users').select('*').where({ id: userId });
  delete user.password;
  res.json(user);
});

/**
 * Middleware to check if user is authenticated
 */
function isAuthenticated(req, res, next) {
  if (req.session.userId) next()
  else {
    res.status(401).json({ error: 'Access denied!' })
    next('route')
  }
}

/**
 * Creates a new user
 */
app.post('/register', async (req, res) => {
  const { first_name, last_name, username, password } = req.body;

  // Verify that all fields are provided
  if (!first_name || !last_name || !username || !password) {
    return res.status(400).json({ error: 'Must provide first name, last name, username, and password' });
  }

  // Verify that username is unique
  const [existingUser] = await knex('users').select('*').where({ username });
  if (existingUser) {
    return res.status(400).json({ error: 'Username already exists' });
  }

  // Salt the password
  const salt = bcrypt.genSaltSync(SALT_ROUNDS);

  // Hash the password
  const hashedPassword = bcrypt.hashSync(password, salt);

  const [user] = await knex('users').insert({ first_name, last_name, username, password: hashedPassword }).returning('*');
  if (!user) {
    return res.status(500).json({ error: 'Unable to create user' });
  }

  res.json({ success: true });
});

app.post('/change_password', isAuthenticated, async (req, res) => {
  const { password } = req.body;

  // Verify that all fields are provided
  if (!password) {
    return res.status(400).json({ error: 'Must provide password' });
  }

  // Salt the password
  const salt = bcrypt.genSaltSync(SALT_ROUNDS);
  const hashedPassword = bcrypt.hashSync(password, salt);
  const { userId } = req.session;
  const [user] = await knex('users').update({ password: hashedPassword }).where({ id: userId }).returning('*');
  if (!user) {
    return res.status(500).json({ error: 'Unable to change password' });
  }

  res.json({ success: true });
});

app.post('/change_user_data', isAuthenticated, async (req, res) => {
  const { first_name, last_name, username } = req.body;

  // Verify that all fields are provided
  if (!first_name || !last_name || !username) {
    return res.status(400).json({ error: 'Must provide first name, last name, and username' });
  }

  // Verify that username is unique or the same as it was
  const [existingUser] = await knex('users').select('*').where({ username });
  if (existingUser && username != existingUser.username) {
    return res.status(400).json({ error: 'Username already exists' });
  }

  const { userId } = req.session;
  const [user] = await knex('users').update({ first_name, last_name, username }).where({ id: userId }).returning('*');
  if (!user) {
    return res.status(500).json({ error: 'Unable to change user data' });
  }

  delete user.password;

  res.json(user);
});

app.post('/login', async (req, res) => {
  const { username, password } = req.body;

  // Verify that all fields are provided
  if (!username || !password) {
    return res.status(400).json({ error: 'Must provide username and password' });
  }

  // Verify that username exists
  const [user] = await knex('users').select('*').where({ username });
  if (!user) {
    return res.status(400).json({ error: 'Username does not exist' });
  }

  // Verify that password is correct
  const passwordMatch = bcrypt.compareSync(password, user.password);
  if (!passwordMatch) {
    return res.status(400).json({ error: 'Password is incorrect' });
  }

  // Set session user id
  req.session.userId = user.id;

  delete user.password;

  res.json(user);
});

app.get('/logout', async (req, res) => {
  req.session.destroy();
  res.json({ success: true });
});

/**
 * Gets all items with additional params
 */
app.get('/items', async (req, res) => {
  let items = await knex('items').select('*');

  // Transform the data based on params

  // param: descLimit will truncate the description and add ellipses

  const { descLimit } = req.query;

  if (descLimit) {
    items.forEach((item) => {
      if (item.description.length > descLimit) {
        item.description = item.description.slice(0, descLimit) + '...';
      }
    });
  }

  // Add a user field which is an object from the user database
  const userIds = items.map((item) => item.user_id);
  const users = await knex('users').select('*').whereIn('id', userIds);
  items.forEach((item) => {
    const user = users.find((user) => user.id === item.user_id);
    delete user.password;
    item.user = user;
  });

  // param: onlyMyItems will filter out items that aren't from the current user

  const { onlyMyItems } = req.query;

  if (onlyMyItems === "true") {
    const { userId } = req.session;
    items = items.filter((item) => item.user_id === userId);
  }

  res.json(items);
});

/**
 * Gets a single item by id
 */
app.get('/items/:id', async (req, res) => {
  const { id } = req.params;

  // Verify that id is an integer
  if (!Number.isInteger(parseInt(id))) {
    return res.status(400).json({ error: 'Id must be an integer' });
  }

  const [item] = await knex('items').select('*').where({ id });

  // param: descLimit will truncate the description and add ellipses

  const { descLimit } = req.query;

  if (descLimit) {
    if (item.description.length > descLimit) {
      item.description = item.description.slice(0, descLimit) + '...';
    }
  }

  //  Add a user field which is an object from the user database
  const userId = item.user_id;
  const [user] = await knex('users').select('*').where({ id: userId });
  delete user.password;
  item.user = user;

  res.json(item);
});

/**
 * Gets a list of items by user id
 */
app.get('/items/user/:id', async (req, res) => {
  const { id } = req.params;
  const items = await knex('items').select('*').where({ user_id: id });
  res.json(items);
});

/**
 * Creates a new item
 */
app.post('/items', isAuthenticated, async (req, res) => {
  const { item_name, description, quantity, user_id } = req.body;
  const [item] = await knex('items').insert({ item_name, description, quantity, user_id }).returning('*');
  res.json(item);
});

/**
 * Updates an item
 */
app.put('/items/:id', isAuthenticated, async (req, res) => {
  const { id } = req.params;
  const { item_name, description, quantity, user_id } = req.body;
  const updatedItem = { item_name, description, quantity, user_id };

  // If all fields are undefined, return an error
  if (Object.values(updatedItem).every((value) => value === undefined)) {
    return res.status(400).json({ error: 'Must provide at least one field to update' });
  }

  const [item] = await knex('items').update(updatedItem).where({ id }).returning('*');

  //  Add a user field which is an object from the user database
  const userId = item.user_id;
  const [user] = await knex('users').select('*').where({ id: userId });
  delete user.password;
  item.user = user;

  res.json(item);
});

/**
 * Deletes an item
 */
app.delete('/items/:id', isAuthenticated, async (req, res) => {
  const { id } = req.params;
  await knex('items').del().where({ id });
  res.json({ success: true });
});


// As an inventory manager I want to be able to create an account so that I can track my inventory.

// As an inventory manager I want to be able to log into my account so that I can see my inventory of items.

// After logging in, the inventory manager should be redirected to their inventory of items.
// As an inventory manager I want to be able to create a new item so that I can share my item details with the world.

// After the item is created, the inventory manager should be redirected to their inventory of items.
// An item displays name, description, and quantity.
// As an inventory manager I want to be able to see a my entire inventory of items.

// The inventory of items should display the first 100 characters of each item description, with “...” at the end if the description is longer than 100 characters.
// As an inventory manager I want to be able to see any individual item I have added.

// The full item information should be displayed.
// As an inventory manager I want to be able to edit an item so that I can fix any mistakes I made creating it.

// When the user toggles edit mode, the page remains the same and the fields become editable.
// As an inventory manager I want to be able to delete an item so that I can remove any unwanted content.

// When the user deletes the item they should be redirected to their inventory of items.
// As a visitor, who is not logged in, I want to be able to view all items created by every inventory manager so that I can browse every item.

// Unauthenticated users should be able to view all items, and any single item.
// The items should only display the first 100 characters of its description with “...” at the end if it is longer than 100 characters.
// As a visitor, who is not logged in, I want to be able to view a specific item created by any user so that I can see all of its details.

// Unauthenticated users should be able to view all items, and any single item.
// As an inventory manager I want to be able to view all items created by every inventory manager so that I can browse every item.

// Unauthenticated users should be able to view all items, and any single item.