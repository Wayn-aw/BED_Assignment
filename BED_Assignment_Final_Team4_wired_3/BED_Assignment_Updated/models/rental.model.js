/*
Owner: Yongsheng 
Feature: Vendor Rental Tracking (US7)
Table: RentalAgreements
*/

const { sql, poolPromise } = require("../dbConfig");

async function create({ stallId, startDate, endDate, monthlyRent }) {
  const pool = await poolPromise;
  const result = await pool
    .request()
    .input("stallId", sql.Int, stallId)
    .input("start", sql.Date, startDate)
    .input("end", sql.Date, endDate)
    .input("rent", sql.Decimal(10, 2), monthlyRent)
    .query(`INSERT INTO RentalAgreements (StallID, StartDate, EndDate, MonthlyRent)
            OUTPUT INSERTED.*
            VALUES (@stallId, @start, @end, @rent)`);
  return result.recordset[0];
}

async function findByStallId(stallId) {
  const pool = await poolPromise;
  const result = await pool
    .request()
    .input("stallId", sql.Int, stallId)
    .query(`SELECT * FROM RentalAgreements WHERE StallID = @stallId ORDER BY StartDate DESC`);
  return result.recordset;
}

async function findById(agreementId) {
  const pool = await poolPromise;
  const result = await pool
    .request()
    .input("id", sql.Int, agreementId)
    .query("SELECT * FROM RentalAgreements WHERE AgreementID = @id");
  return result.recordset[0] || null;
}

async function update(agreementId, { endDate, monthlyRent, status }) {
  const pool = await poolPromise;
  const result = await pool
    .request()
    .input("id", sql.Int, agreementId)
    .input("endDate", sql.Date, endDate)
    .input("rent", sql.Decimal(10, 2), monthlyRent)
    .input("status", sql.VarChar, status)
    .query(`UPDATE RentalAgreements SET EndDate = @endDate, MonthlyRent = @rent, Status = @status
            OUTPUT INSERTED.*
            WHERE AgreementID = @id`);
  return result.recordset[0] || null;
}

async function remove(agreementId) {
  const pool = await poolPromise;
  await pool.request().input("id", sql.Int, agreementId).query("DELETE FROM RentalAgreements WHERE AgreementID = @id");
}

module.exports = { create, findByStallId, findById, update, remove };
