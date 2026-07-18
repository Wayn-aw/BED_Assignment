/**
 * models/stall.model.js
 * Owner: Kyra | Feature: Browse Food Stalls & Menu (US1)
 * Tables: Stalls, MenuItems (read-only joins)
 */

const { sql, poolPromise } = require("../dbConfig");

async function findAll() {
  const pool = await poolPromise;
  const result = await pool.request().query(`
    SELECT s.StallID, s.StallName, s.Description, s.ImageURL,
           u.Name AS OwnerName,
           hg.Grade AS CurrentHygieneGrade,
           (SELECT AVG(CAST(Rating AS FLOAT)) FROM Feedback f WHERE f.StallID = s.StallID) AS AverageRating
    FROM Stalls s
    JOIN Users u ON u.UserID = s.OwnerID
    OUTER APPLY (
      SELECT TOP 1 Grade FROM HygieneGrades hg
      WHERE hg.StallID = s.StallID
      ORDER BY ValidFrom DESC
    ) hg
    ORDER BY s.StallName;
  `);
  return result.recordset;
}

async function findById(stallId) {
  const pool = await poolPromise;
  const result = await pool
    .request()
    .input("stallId", sql.Int, stallId)
    .query(`SELECT s.StallID, s.StallName, s.Description, s.ImageURL, u.Name AS OwnerName
            FROM Stalls s JOIN Users u ON u.UserID = s.OwnerID
            WHERE s.StallID = @stallId`);
  return result.recordset[0] || null;
}

async function findMenuByStallId(stallId) {
  const pool = await poolPromise;
  const result = await pool
    .request()
    .input("stallId", sql.Int, stallId)
    .query(`SELECT mi.ItemID, mi.ItemName, mi.Description, mi.Price, mi.Category, mi.IsAvailable,
                   STRING_AGG(c.Name, ', ') AS Cuisines,
                   (SELECT COUNT(*) FROM ItemLikes il WHERE il.ItemID = mi.ItemID) AS LikeCount
            FROM MenuItems mi
            LEFT JOIN MenuItemCuisines mic ON mic.ItemID = mi.ItemID
            LEFT JOIN Cuisines c ON c.CuisineID = mic.CuisineID
            WHERE mi.StallID = @stallId
            GROUP BY mi.ItemID, mi.ItemName, mi.Description, mi.Price, mi.Category, mi.IsAvailable
            ORDER BY mi.Category, mi.ItemName`);
  return result.recordset;
}

// Used by other members' models (e.g. Feedback, Complaints) to validate a stallId exists
async function exists(stallId) {
  const pool = await poolPromise;
  const result = await pool
    .request()
    .input("stallId", sql.Int, stallId)
    .query("SELECT StallID FROM Stalls WHERE StallID = @stallId");
  return result.recordset.length > 0;
}

// Used by Vendor-owned features (Menu, Promotions) to check ownership
async function isOwnedBy(stallId, vendorUserId) {
  const pool = await poolPromise;
  const result = await pool
    .request()
    .input("stallId", sql.Int, stallId)
    .input("ownerId", sql.Int, vendorUserId)
    .query("SELECT StallID FROM Stalls WHERE StallID = @stallId AND OwnerID = @ownerId");
  return result.recordset.length > 0;
}

module.exports = { findAll, findById, findMenuByStallId, exists, isOwnedBy };
