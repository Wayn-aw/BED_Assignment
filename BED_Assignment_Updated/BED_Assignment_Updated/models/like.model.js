/*
Owner: Yongsheng 
Feature: Item Likes (US10)
Table: ItemLikes
 */

const { sql, poolPromise } = require("../dbConfig");

async function itemExists(itemId) {
  const pool = await poolPromise;
  const result = await pool.request().input("itemId", sql.Int, itemId).query("SELECT ItemID FROM MenuItems WHERE ItemID = @itemId");
  return result.recordset.length > 0;
}

async function find(patronId, itemId) {
  const pool = await poolPromise;
  const result = await pool
    .request()
    .input("patronId", sql.Int, patronId)
    .input("itemId", sql.Int, itemId)
    .query("SELECT LikeID FROM ItemLikes WHERE PatronID = @patronId AND ItemID = @itemId");
  return result.recordset[0] || null;
}

async function create(patronId, itemId) {
  const pool = await poolPromise;
  await pool
    .request()
    .input("patronId", sql.Int, patronId)
    .input("itemId", sql.Int, itemId)
    .query("INSERT INTO ItemLikes (PatronID, ItemID) VALUES (@patronId, @itemId)");
}

async function remove(likeId) {
  const pool = await poolPromise;
  await pool.request().input("id", sql.Int, likeId).query("DELETE FROM ItemLikes WHERE LikeID = @id");
}

async function countByItemId(itemId) {
  const pool = await poolPromise;
  const result = await pool
    .request()
    .input("itemId", sql.Int, itemId)
    .query("SELECT COUNT(*) AS LikeCount FROM ItemLikes WHERE ItemID = @itemId");
  return result.recordset[0].LikeCount;
}

module.exports = { itemExists, find, create, remove, countByItemId };
