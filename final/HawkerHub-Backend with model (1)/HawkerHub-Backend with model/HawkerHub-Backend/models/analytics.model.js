/**
 * models/analytics.model.js
 * Owner: Yongsheng | Feature: Operator Sales Analytics (US11)
 * Tables: Orders, OrderItems (read-only aggregate queries)
 */

const { sql, poolPromise } = require("../dbConfig");

async function getRevenueSummary(stallId) {
  const pool = await poolPromise;
  const result = await pool
    .request()
    .input("stallId", sql.Int, stallId)
    .query(`SELECT SUM(TotalAmount) AS TotalRevenue, COUNT(OrderID) AS TotalOrders
            FROM Orders WHERE StallID = @stallId AND OrderStatus <> 'Cancelled'`);
  return result.recordset[0];
}

async function getPopularItems(stallId) {
  const pool = await poolPromise;
  const result = await pool
    .request()
    .input("stallId", sql.Int, stallId)
    .query(`SELECT TOP 5 mi.ItemName, SUM(oi.Quantity) AS TotalSold, SUM(oi.Subtotal) AS Revenue
            FROM OrderItems oi
            JOIN MenuItems mi ON mi.ItemID = oi.ItemID
            JOIN Orders o ON o.OrderID = oi.OrderID
            WHERE mi.StallID = @stallId AND o.OrderStatus <> 'Cancelled'
            GROUP BY mi.ItemName
            ORDER BY TotalSold DESC`);
  return result.recordset;
}

async function getPeakHours(stallId) {
  const pool = await poolPromise;
  const result = await pool
    .request()
    .input("stallId", sql.Int, stallId)
    .query(`SELECT DATEPART(HOUR, OrderDate) AS HourOfDay, COUNT(OrderID) AS OrderCount
            FROM Orders
            WHERE StallID = @stallId AND OrderStatus <> 'Cancelled'
            GROUP BY DATEPART(HOUR, OrderDate)
            ORDER BY OrderCount DESC`);
  return result.recordset;
}

module.exports = { getRevenueSummary, getPopularItems, getPeakHours };
