/*
Owner: Kyra 
Feature: Browse Food Stalls & Menu (US1)
Tables: Stalls, MenuItems (read-only joins)
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

// ---- CREATE / UPDATE / DELETE (Operator/Admin manage which stalls sit in
// their centre; a Vendor may edit their own stall's display details) ----

async function centreExists(centreId) {
  const pool = await poolPromise;
  const result = await pool.request().input("centreId", sql.Int, centreId).query("SELECT CentreID FROM HawkerCentres WHERE CentreID = @centreId");
  return result.recordset.length > 0;
}

// Confirms ownerId belongs to a user with the Vendor role, so a Stall never
// ends up owned by a Patron/Operator/etc. by accident.
async function isVendor(userId) {
  const pool = await poolPromise;
  const result = await pool.request().input("userId", sql.Int, userId).query("SELECT UserID FROM Users WHERE UserID = @userId AND Role = 'Vendor'");
  return result.recordset.length > 0;
}

// Raw row (unlike findById, includes CentreID/OwnerID) - used internally for
// ownership checks and as the update fallback values.
async function findRaw(stallId) {
  const pool = await poolPromise;
  const result = await pool.request().input("id", sql.Int, stallId).query("SELECT * FROM Stalls WHERE StallID = @id");
  return result.recordset[0] || null;
}

async function create({ centreId, ownerId, stallName, description, imageUrl }) {
  const pool = await poolPromise;
  const result = await pool
    .request()
    .input("centreId", sql.Int, centreId)
    .input("ownerId", sql.Int, ownerId)
    .input("stallName", sql.VarChar, stallName)
    .input("description", sql.VarChar, description || null)
    .input("imageUrl", sql.VarChar, imageUrl || null)
    .query(`INSERT INTO Stalls (CentreID, OwnerID, StallName, Description, ImageURL)
            OUTPUT INSERTED.*
            VALUES (@centreId, @ownerId, @stallName, @description, @imageUrl)`);
  return result.recordset[0];
}

async function update(stallId, { stallName, description, imageUrl }) {
  const pool = await poolPromise;
  const result = await pool
    .request()
    .input("id", sql.Int, stallId)
    .input("stallName", sql.VarChar, stallName)
    .input("description", sql.VarChar, description)
    .input("imageUrl", sql.VarChar, imageUrl)
    .query(`UPDATE Stalls SET StallName = @stallName, Description = @description, ImageURL = @imageUrl
            OUTPUT INSERTED.*
            WHERE StallID = @id`);
  return result.recordset[0] || null;
}

// Plain DELETE - deliberately no manual dependency checks. If the stall still
// has MenuItems/Orders/Promotions/RentalAgreements pointing at it, the FK
// violation (MSSQL error 547) is already caught by errorHandler.js and mapped
// to a clean 409, same as every other delete in this codebase.
async function remove(stallId) {
  const pool = await poolPromise;
  await pool.request().input("id", sql.Int, stallId).query("DELETE FROM Stalls WHERE StallID = @id");
}

module.exports = { findAll, findById, findMenuByStallId, exists, isOwnedBy, centreExists, isVendor, findRaw, create, update, remove };
