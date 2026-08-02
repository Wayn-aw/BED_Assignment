/*
Owner: Kenneth 
Feature: Payment Confirmation & Multiple Payment Options (US8, US9)
Table: Payments
 */

const { sql, poolPromise } = require("../dbConfig");

async function findOrderById(orderId) {
  const pool = await poolPromise;
  const result = await pool
    .request()
    .input("orderId", sql.Int, orderId)
    .query("SELECT OrderID, PatronID, TotalAmount FROM Orders WHERE OrderID = @orderId");
  return result.recordset[0] || null;
}

async function findByOrderId(orderId) {
  const pool = await poolPromise;
  const result = await pool
    .request()
    .input("orderId", sql.Int, orderId)
    .query("SELECT * FROM Payments WHERE OrderID = @orderId");
  return result.recordset[0] || null;
}

async function findById(paymentId) {
  const pool = await poolPromise;
  const result = await pool.request().input("id", sql.Int, paymentId).query("SELECT * FROM Payments WHERE PaymentID = @id");
  return result.recordset[0] || null;
}

async function create({ orderId, paymentMethod, amount, status }) {
  const pool = await poolPromise;
  const result = await pool
    .request()
    .input("orderId", sql.Int, orderId)
    .input("method", sql.VarChar, paymentMethod)
    .input("amount", sql.Decimal(10, 2), amount)
    .input("status", sql.VarChar, status)
    .query(`INSERT INTO Payments (OrderID, PaymentMethod, Amount, PaymentStatus, PaidAt)
            OUTPUT INSERTED.*
            VALUES (@orderId, @method, @amount, @status, ${status === "Success" ? "GETDATE()" : "NULL"})`);
  return result.recordset[0];
}

async function updateStatus(paymentId, status) {
  const pool = await poolPromise;
  const result = await pool
    .request()
    .input("id", sql.Int, paymentId)
    .input("status", sql.VarChar, status)
    .query(`UPDATE Payments
            SET PaymentStatus = @status, PaidAt = CASE WHEN @status = 'Success' THEN GETDATE() ELSE PaidAt END
            OUTPUT INSERTED.*
            WHERE PaymentID = @id`);
  return result.recordset[0] || null;
}

async function remove(paymentId) {
  const pool = await poolPromise;
  await pool.request().input("id", sql.Int, paymentId).query("DELETE FROM Payments WHERE PaymentID = @id");
}

module.exports = { findOrderById, findByOrderId, findById, create, updateStatus, remove };
