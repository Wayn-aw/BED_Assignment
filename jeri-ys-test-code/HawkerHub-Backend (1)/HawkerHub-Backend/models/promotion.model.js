/**
 * models/promotion.model.js
 * Owner: Jeremiah | Feature: Vendor Promotions (US14)
 * Table: Promotions
 */

const { sql, poolPromise } = require("../dbConfig");

async function create({ stallId, title, discountPercentage, startDate, endDate }) {
  const pool = await poolPromise;
  const result = await pool
    .request()
    .input("stallId", sql.Int, stallId)
    .input("title", sql.VarChar, title)
    .input("pct", sql.Int, discountPercentage)
    .input("start", sql.DateTime, startDate)
    .input("end", sql.DateTime, endDate)
    .query(`INSERT INTO Promotions (StallID, Title, DiscountPercentage, StartDate, EndDate)
            OUTPUT INSERTED.*
            VALUES (@stallId, @title, @pct, @start, @end)`);
  return result.recordset[0];
}

async function findByStallId(stallId) {
  const pool = await poolPromise;
  const result = await pool
    .request()
    .input("stallId", sql.Int, stallId)
    .query(`SELECT *,
                   CASE WHEN GETDATE() BETWEEN StartDate AND EndDate THEN 'Active'
                        WHEN GETDATE() < StartDate THEN 'Upcoming'
                        ELSE 'Ended' END AS Status
            FROM Promotions
            WHERE StallID = @stallId
            ORDER BY StartDate DESC`);
  return result.recordset;
}

async function findById(promoId) {
  const pool = await poolPromise;
  const result = await pool.request().input("id", sql.Int, promoId).query("SELECT * FROM Promotions WHERE PromoID = @id");
  return result.recordset[0] || null;
}

async function remove(promoId) {
  const pool = await poolPromise;
  await pool.request().input("id", sql.Int, promoId).query("DELETE FROM Promotions WHERE PromoID = @id");
}

module.exports = { create, findByStallId, findById, remove };
