const express = require('express')
const app = express()
const port = 3000

app.get('/', (req, res) => {
  res.send('Hello World!')
})

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})


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