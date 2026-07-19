/**
 * models/complaint.model.js
 * Owner: Kyra | Feature: Lodge Customer Complaint (US13)
 * Table: Complaints
 */

const { sql, poolPromise } = require("../dbConfig");

async function create({ patronId, stallId, description }) {
  const pool = await poolPromise;
  const result = await pool
    .request()
    .input("patronId", sql.Int, patronId)
    .input("stallId", sql.Int, stallId)
    .input("desc", sql.VarChar, description)
    .query(`INSERT INTO Complaints (PatronID, StallID, Description)
            OUTPUT INSERTED.*
            VALUES (@patronId, @stallId, @desc)`);
  return result.recordset[0];
}

async function findByPatronId(patronId) {
  const pool = await poolPromise;
  const result = await pool
    .request()
    .input("patronId", sql.Int, patronId)
    .query(`SELECT c.*, s.StallName
            FROM Complaints c JOIN Stalls s ON s.StallID = c.StallID
            WHERE c.PatronID = @patronId
            ORDER BY c.CreatedAt DESC`);
  return result.recordset;
}

async function updateStatus(complaintId, status) {
  const pool = await poolPromise;
  const result = await pool
    .request()
    .input("id", sql.Int, complaintId)
    .input("status", sql.VarChar, status)
    .query(`UPDATE Complaints SET Status = @status
            OUTPUT INSERTED.*
            WHERE ComplaintID = @id`);
  return result.recordset[0] || null;
}

module.exports = { create, findByPatronId, updateStatus };
