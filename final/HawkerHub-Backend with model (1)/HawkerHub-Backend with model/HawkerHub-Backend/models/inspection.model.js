/**
 * models/inspection.model.js
 * Owner: Jeremiah | Feature: NEA Hygiene Inspections & Grades (US4, US12)
 * Tables: Inspections, HygieneGrades
 */

const { sql, poolPromise } = require("../dbConfig");

function scoreToGrade(score) {
  if (score >= 90) return "A";
  if (score >= 75) return "B";
  if (score >= 60) return "C";
  return "D";
}

// Creates an inspection AND its derived hygiene grade in one transaction
async function createWithGrade({ stallId, officerId, score, remarks }) {
  const pool = await poolPromise;
  const transaction = new sql.Transaction(pool);
  await transaction.begin();

  try {
    const inspectionResult = await new sql.Request(transaction)
      .input("stallId", sql.Int, stallId)
      .input("officerId", sql.Int, officerId)
      .input("score", sql.Int, score)
      .input("remarks", sql.VarChar, remarks)
      .query(`INSERT INTO Inspections (StallID, OfficerID, Score, Remarks)
              OUTPUT INSERTED.*
              VALUES (@stallId, @officerId, @score, @remarks)`);
    const inspection = inspectionResult.recordset[0];

    // Close out the previous "current" grade (ValidTo = today) if one exists
    await new sql.Request(transaction)
      .input("stallId", sql.Int, stallId)
      .query(`UPDATE HygieneGrades SET ValidTo = GETDATE()
              WHERE StallID = @stallId AND ValidTo IS NULL`);

    const grade = scoreToGrade(score);
    const gradeResult = await new sql.Request(transaction)
      .input("inspectionId", sql.Int, inspection.InspectionID)
      .input("stallId", sql.Int, stallId)
      .input("grade", sql.Char(1), grade)
      .query(`INSERT INTO HygieneGrades (InspectionID, StallID, Grade)
              OUTPUT INSERTED.*
              VALUES (@inspectionId, @stallId, @grade)`);

    await transaction.commit();
    return { ...inspection, grade: gradeResult.recordset[0] };
  } catch (err) {
    await transaction.rollback();
    throw err;
  }
}

async function findHistoryByStallId(stallId) {
  const pool = await poolPromise;
  const result = await pool
    .request()
    .input("stallId", sql.Int, stallId)
    .query(`SELECT i.InspectionID, i.Score, i.Remarks, i.InspectionDate,
                   u.Name AS OfficerName, hg.Grade, hg.ValidFrom, hg.ValidTo
            FROM Inspections i
            JOIN Users u ON u.UserID = i.OfficerID
            LEFT JOIN HygieneGrades hg ON hg.InspectionID = i.InspectionID
            WHERE i.StallID = @stallId
            ORDER BY i.InspectionDate DESC`);
  return result.recordset;
}

async function findById(inspectionId) {
  const pool = await poolPromise;
  const result = await pool
    .request()
    .input("id", sql.Int, inspectionId)
    .query("SELECT * FROM Inspections WHERE InspectionID = @id");
  return result.recordset[0] || null;
}

async function update(inspectionId, { score, remarks }) {
  const pool = await poolPromise;
  const result = await pool
    .request()
    .input("id", sql.Int, inspectionId)
    .input("score", sql.Int, score)
    .input("remarks", sql.VarChar, remarks)
    .query(`UPDATE Inspections SET Score = @score, Remarks = @remarks
            OUTPUT INSERTED.*
            WHERE InspectionID = @id`);
  return result.recordset[0] || null;
}

async function remove(inspectionId) {
  const pool = await poolPromise;
  await pool.request().input("id", sql.Int, inspectionId).query("DELETE FROM Inspections WHERE InspectionID = @id");
}

module.exports = { createWithGrade, findHistoryByStallId, findById, update, remove };
