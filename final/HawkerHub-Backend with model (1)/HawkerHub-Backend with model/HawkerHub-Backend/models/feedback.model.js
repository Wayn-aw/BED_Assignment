/**
 * models/feedback.model.js
 * Owner: Kyra | Feature: Patron Feedback (US5)
 * Table: Feedback
 */

const { sql, poolPromise } = require("../dbConfig");

async function create({ patronId, stallId, rating, comments }) {
  const pool = await poolPromise;
  const result = await pool
    .request()
    .input("patronId", sql.Int, patronId)
    .input("stallId", sql.Int, stallId)
    .input("rating", sql.Int, rating)
    .input("comments", sql.VarChar, comments || null)
    .query(`INSERT INTO Feedback (PatronID, StallID, Rating, Comments)
            OUTPUT INSERTED.*
            VALUES (@patronId, @stallId, @rating, @comments)`);
  return result.recordset[0];
}

async function findByStallId(stallId) {
  const pool = await poolPromise;
  const result = await pool
    .request()
    .input("stallId", sql.Int, stallId)
    .query(`SELECT f.FeedbackID, f.Rating, f.Comments, f.CreatedAt, u.Name AS PatronName
            FROM Feedback f JOIN Users u ON u.UserID = f.PatronID
            WHERE f.StallID = @stallId
            ORDER BY f.CreatedAt DESC`);
  return result.recordset;
}

async function findById(feedbackId) {
  const pool = await poolPromise;
  const result = await pool
    .request()
    .input("id", sql.Int, feedbackId)
    .query("SELECT * FROM Feedback WHERE FeedbackID = @id");
  return result.recordset[0] || null;
}

async function update(feedbackId, { rating, comments }) {
  const pool = await poolPromise;
  const result = await pool
    .request()
    .input("id", sql.Int, feedbackId)
    .input("rating", sql.Int, rating)
    .input("comments", sql.VarChar, comments)
    .query(`UPDATE Feedback SET Rating = @rating, Comments = @comments
            OUTPUT INSERTED.*
            WHERE FeedbackID = @id`);
  return result.recordset[0] || null;
}

async function remove(feedbackId) {
  const pool = await poolPromise;
  await pool.request().input("id", sql.Int, feedbackId).query("DELETE FROM Feedback WHERE FeedbackID = @id");
}

module.exports = { create, findByStallId, findById, update, remove };
