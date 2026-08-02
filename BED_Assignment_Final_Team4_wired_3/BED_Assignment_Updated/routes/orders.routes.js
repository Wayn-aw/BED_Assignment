/*
Owner: Wayne
Feature: Add to Cart & Checkout (US3)
*/

const express = require("express");
const router = express.Router();
const ordersController = require("../controllers/orders.controller");
const { optionalAuth, verifyToken, requireRole } = require("../middlewares/auth.middleware");

router.post(
  "/",
  // #swagger.tags = ['Orders']
  // #swagger.summary = 'Checkout the cart (guest or logged-in Patron)'
  // #swagger.description = 'If a valid JWT is supplied the order is linked to that Patron; otherwise it is a guest order (patronId is null).'
  /* #swagger.requestBody = { required: true, content: { "application/json": { schema: { $ref: "#/components/schemas/OrderRequest" } } } } */
  /* #swagger.responses[201] = { description: 'Order placed successfully.' } */
  /* #swagger.responses[400] = { description: 'Missing stallId/items, or an item has an invalid itemId/quantity.' } */
  optionalAuth,
  ordersController.createOrder
);

router.get(
  "/mine",
  // #swagger.tags = ['Orders']
  // #swagger.summary = "Get the logged-in Patron's own order history"
  // #swagger.description = 'Must be registered above the /:id route below - otherwise Express matches "mine" as an :id value first.'
  /* #swagger.security = [{ "bearerAuth": [] }] */
  /* #swagger.responses[200] = { description: 'Orders returned, most recent first.' } */
  verifyToken,
  requireRole("Patron"),
  ordersController.getMyOrders
);

router.get(
  "/:id",
  // #swagger.tags = ['Orders']
  // #swagger.summary = 'Get an order and its line items'
  /* #swagger.parameters['id'] = { in: 'path', description: 'OrderID', required: true, schema: { type: 'integer' } } */
  /* #swagger.responses[200] = { description: 'Order (with items array) returned.' } */
  /* #swagger.responses[404] = { description: 'Order not found.' } */
  optionalAuth,
  ordersController.getOrderById
);

router.put(
  "/:id",
  // #swagger.tags = ['Orders']
  // #swagger.summary = "Update an order's status (Vendor only)"
  // #swagger.description = 'status must be one of Pending, Preparing, Ready, Collected, Cancelled.'
  /* #swagger.security = [{ "bearerAuth": [] }] */
  /* #swagger.parameters['id'] = { in: 'path', description: 'OrderID', required: true, schema: { type: 'integer' } } */
  /* #swagger.requestBody = { required: true, content: { "application/json": { schema: { type: "object", required: ["status"], properties: { status: { type: "string", enum: ["Pending", "Preparing", "Ready", "Collected", "Cancelled"] } } } } } } */
  /* #swagger.responses[200] = { description: 'Order status updated.' } */
  /* #swagger.responses[400] = { description: 'status is not one of the allowed values.' } */
  /* #swagger.responses[404] = { description: 'Order not found.' } */
  verifyToken,
  requireRole("Vendor"),
  ordersController.updateOrderStatus
);

module.exports = router;
