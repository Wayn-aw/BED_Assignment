/*
Owner: Wayne
Feature: Add to Cart & Checkout (US3)
Tables: Orders, OrderItems
*/

const { sql, poolPromise } = require("../dbConfig");

async function findMenuItemForStall(itemId, stallId, transaction) {
  const result = await new sql.Request(transaction)
    .input("itemId", sql.Int, itemId)
    .input("stallId", sql.Int, stallId)
    .query(`SELECT ItemID, Price, IsAvailable FROM MenuItems WHERE ItemID = @itemId AND StallID = @stallId`);
  return result.recordset[0] || null;
}

async function checkout({ patronId, stallId, items }) {
  const pool = await poolPromise;
  const transaction = new sql.Transaction(pool);

  await transaction.begin();
  try {
    let total = 0;
    const resolvedItems = [];

    for (const it of items) {
      const menuItem = await findMenuItemForStall(it.itemId, stallId, transaction);
      if (!menuItem) {
        throw Object.assign(new Error(`Menu item ${it.itemId} does not belong to this stall.`), { statusCode: 400 });
      }
      if (!menuItem.IsAvailable) {
        throw Object.assign(new Error(`Menu item ${it.itemId} is currently unavailable.`), { statusCode: 400 });
      }
      const subtotal = menuItem.Price * it.quantity;
      total += subtotal;
      resolvedItems.push({ itemId: it.itemId, quantity: it.quantity, unitPrice: menuItem.Price });
    }

    const orderResult = await new sql.Request(transaction)
      .input("patronId", sql.Int, patronId)
      .input("stallId", sql.Int, stallId)
      .input("total", sql.Decimal(10, 2), total)
      .query(`INSERT INTO Orders (PatronID, StallID, TotalAmount)
              OUTPUT INSERTED.*
              VALUES (@patronId, @stallId, @total)`);
    const order = orderResult.recordset[0];

    for (const ri of resolvedItems) {
      await new sql.Request(transaction)
        .input("orderId", sql.Int, order.OrderID)
        .input("itemId", sql.Int, ri.itemId)
        .input("qty", sql.Int, ri.quantity)
        .input("price", sql.Decimal(8, 2), ri.unitPrice)
        .query(`INSERT INTO OrderItems (OrderID, ItemID, Quantity, UnitPrice)
                VALUES (@orderId, @itemId, @qty, @price)`);
    }

    await transaction.commit();
    return order;
  } catch (err) {
    await transaction.rollback();
    throw err;
  }
}

async function findById(orderId) {
  const pool = await poolPromise;
  const result = await pool.request().input("id", sql.Int, orderId).query("SELECT * FROM Orders WHERE OrderID = @id");
  return result.recordset[0] || null;
}

async function findItemsByOrderId(orderId) {
  const pool = await poolPromise;
  const result = await pool
    .request()
    .input("id", sql.Int, orderId)
    .query(`SELECT oi.OrderItemID, oi.ItemID, mi.ItemName, oi.Quantity, oi.UnitPrice, oi.Subtotal
            FROM OrderItems oi JOIN MenuItems mi ON mi.ItemID = oi.ItemID
            WHERE oi.OrderID = @id`);
  return result.recordset;
}

async function updateStatus(orderId, status) {
  const pool = await poolPromise;
  const result = await pool
    .request()
    .input("id", sql.Int, orderId)
    .input("status", sql.VarChar, status)
    .query(`UPDATE Orders SET OrderStatus = @status
            OUTPUT INSERTED.*
            WHERE OrderID = @id`);
  return result.recordset[0] || null;
}

module.exports = { checkout, findById, findItemsByOrderId, updateStatus };
