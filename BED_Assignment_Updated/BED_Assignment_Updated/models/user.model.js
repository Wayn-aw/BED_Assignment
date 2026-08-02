/*
Owner: Kenneth
Feature: Account Management (US2)
Table: Users
*/

const { sql, poolPromise } = require("../dbConfig");

async function findByEmail(email) {
  const pool = await poolPromise;
  const result = await pool
    .request()
    .input("email", sql.VarChar, email)
    .query("SELECT * FROM Users WHERE Email = @email AND IsActive = 1");
  return result.recordset[0] || null;
}

async function findById(userId) {
  const pool = await poolPromise;
  const result = await pool
    .request()
    .input("userId", sql.Int, userId)
    .query(`SELECT UserID, Name, Email, Role, Phone, CreatedAt, IsActive
            FROM Users WHERE UserID = @userId`);
  return result.recordset[0] || null;
}

async function create({ name, email, passwordHash, role, phone }) {
  const pool = await poolPromise;
  const result = await pool
    .request()
    .input("name", sql.VarChar, name)
    .input("email", sql.VarChar, email)
    .input("hash", sql.VarChar, passwordHash)
    .input("role", sql.VarChar, role)
    .input("phone", sql.VarChar, phone)
    .query(`INSERT INTO Users (Name, Email, PasswordHash, Role, Phone)
              OUTPUT INSERTED.UserID, INSERTED.Name, INSERTED.Email, INSERTED.Role, INSERTED.Phone, INSERTED.CreatedAt
              VALUES (@name, @email, @hash, @role, @phone)`);
  return result.recordset[0];
}

async function updateProfile(userId, { name, phone }) {
  const pool = await poolPromise;
  const result = await pool
    .request()
    .input("userId", sql.Int, userId)
    .input("name", sql.VarChar, name)
    .input("phone", sql.VarChar, phone || null)
    .query(`UPDATE Users SET Name = @name, Phone = @phone
            OUTPUT INSERTED.UserID, INSERTED.Name, INSERTED.Email, INSERTED.Phone
            WHERE UserID = @userId`);
  return result.recordset[0] || null;
}

async function deactivate(userId) {
  const pool = await poolPromise;
  const result = await pool
    .request()
    .input("userId", sql.Int, userId)
    .query(`UPDATE Users SET IsActive = 0
            OUTPUT INSERTED.UserID, INSERTED.IsActive
            WHERE UserID = @userId`);
  return result.recordset[0] || null;
}

module.exports = { findByEmail, findById, create, updateProfile, deactivate };
