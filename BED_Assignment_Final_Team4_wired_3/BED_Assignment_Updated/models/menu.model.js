/*
Owner: Wayne 
Feature: Vendor Menu CRUD (US6)
Table: MenuItems (+ MenuItemCuisines junction)
 */

const { sql, poolPromise } = require("../dbConfig");

async function create({ stallId, itemName, description, price, category, imageUrl }) {
  const pool = await poolPromise;
  const result = await pool
    .request()
    .input("stallId", sql.Int, stallId)
    .input("itemName", sql.VarChar, itemName)
    .input("description", sql.VarChar, description || null)
    .input("price", sql.Decimal(8, 2), price)
    .input("category", sql.VarChar, category)
    .input("imageUrl", sql.VarChar, imageUrl || null)
    .query(`INSERT INTO MenuItems (StallID, ItemName, Description, Price, Category, ImageURL)
            OUTPUT INSERTED.*
            VALUES (@stallId, @itemName, @description, @price, @category, @imageUrl)`);
  return result.recordset[0];
}

async function addCuisines(itemId, cuisineIds) {
  const pool = await poolPromise;
  for (const cuisineId of cuisineIds) {
    await pool
      .request()
      .input("itemId", sql.Int, itemId)
      .input("cuisineId", sql.Int, cuisineId)
      .query("INSERT INTO MenuItemCuisines (ItemID, CuisineID) VALUES (@itemId, @cuisineId)");
  }
}

async function findById(itemId) {
  const pool = await poolPromise;
  const result = await pool.request().input("id", sql.Int, itemId).query("SELECT * FROM MenuItems WHERE ItemID = @id");
  return result.recordset[0] || null;
}

async function update(itemId, { itemName, description, price, category, isAvailable, imageUrl }) {
  const pool = await poolPromise;
  const result = await pool
    .request()
    .input("id", sql.Int, itemId)
    .input("itemName", sql.VarChar, itemName)
    .input("description", sql.VarChar, description)
    .input("price", sql.Decimal(8, 2), price)
    .input("category", sql.VarChar, category)
    .input("isAvailable", sql.Bit, isAvailable)
    .input("imageUrl", sql.VarChar, imageUrl)
    .query(`UPDATE MenuItems
            SET ItemName = @itemName, Description = @description, Price = @price,
                Category = @category, IsAvailable = @isAvailable, ImageURL = @imageUrl
            OUTPUT INSERTED.*
            WHERE ItemID = @id`);
  return result.recordset[0] || null;
}

async function remove(itemId) {
  const pool = await poolPromise;
  await pool.request().input("id", sql.Int, itemId).query("DELETE FROM MenuItems WHERE ItemID = @id");
}

// Cuisines for a single menu item - fills the gap where GET /menu/:id
// didn't expose the many-to-many relationship at all.
async function findCuisinesForItem(itemId) {
  const pool = await poolPromise;
  const result = await pool
    .request()
    .input("itemId", sql.Int, itemId)
    .query(`SELECT c.CuisineID, c.Name
            FROM MenuItemCuisines mic JOIN Cuisines c ON c.CuisineID = mic.CuisineID
            WHERE mic.ItemID = @itemId
            ORDER BY c.Name`);
  return result.recordset;
}

// All cuisines in the system - lets a client discover valid cuisineIds to
// pass into create()/addCuisines() above, which previously had no way to
// be looked up.
async function listAllCuisines() {
  const pool = await poolPromise;
  const result = await pool.request().query("SELECT CuisineID, Name FROM Cuisines ORDER BY Name");
  return result.recordset;
}

module.exports = { create, addCuisines, findById, update, remove, findCuisinesForItem, listAllCuisines };
