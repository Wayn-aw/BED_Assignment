/*
Owner: Kenneth
Feature: Payment Confirmation & Multiple Payment Options (US8, US9)
*/

const express = require("express");
const router = express.Router();
const paymentsController = require("../controllers/payments.controller");
const { verifyToken, requireRole } = require("../middlewares/auth.middleware");

router.post(
  "/",
  // #swagger.tags = ['Payments']
  // #swagger.summary = 'Create a payment for an order'
  // #swagger.description = "Simulated payment gateway (bank interfaces are handled by another team per the case brief). paymentMethod must be Cash, NETS, PayNow or CreditCard."
  /* #swagger.security = [{ "bearerAuth": [] }] */
  /* #swagger.requestBody = { required: true, content: { "application/json": { schema: { type: "object", required: ["orderId", "paymentMethod"], properties: { orderId: { type: "integer", example: 1 }, paymentMethod: { type: "string", enum: ["Cash", "NETS", "PayNow", "CreditCard"] } } } } } } */
  /* #swagger.responses[201] = { description: 'Payment successful.' } */
  /* #swagger.responses[400] = { description: 'Missing field, or paymentMethod is not one of the allowed values.' } */
  /* #swagger.responses[404] = { description: 'Order not found.' } */
  /* #swagger.responses[409] = { description: 'This order has already been paid for.' } */
  verifyToken,
  paymentsController.createPayment
);

router.get(
  "/:orderId",
  // #swagger.tags = ['Payments']
  // #swagger.summary = 'Get the payment status for an order'
  /* #swagger.security = [{ "bearerAuth": [] }] */
  /* #swagger.parameters['orderId'] = { in: 'path', description: 'OrderID', required: true, schema: { type: 'integer' } } */
  /* #swagger.responses[200] = { description: 'Payment returned.' } */
  /* #swagger.responses[404] = { description: 'No payment found for this order.' } */
  verifyToken,
  paymentsController.getPaymentByOrder
);

router.put(
  "/:id",
  // #swagger.tags = ['Payments']
  // #swagger.summary = 'Update a payment status, e.g. retry a failed payment'
  // #swagger.description = 'status must be one of Pending, Success, Failed.'
  /* #swagger.security = [{ "bearerAuth": [] }] */
  /* #swagger.parameters['id'] = { in: 'path', description: 'PaymentID', required: true, schema: { type: 'integer' } } */
  /* #swagger.requestBody = { required: true, content: { "application/json": { schema: { type: "object", required: ["status"], properties: { status: { type: "string", enum: ["Pending", "Success", "Failed"] } } } } } } */
  /* #swagger.responses[200] = { description: 'Payment status updated.' } */
  /* #swagger.responses[400] = { description: 'status is not one of the allowed values.' } */
  /* #swagger.responses[404] = { description: 'Payment not found.' } */
  verifyToken,
  paymentsController.updatePaymentStatus
);

router.delete(
  "/:id",
  // #swagger.tags = ['Payments']
  // #swagger.summary = 'Delete a payment record (Operator / Admin only)'
  // #swagger.description = 'Restricted more tightly than the other Payments routes on purpose - reversing a payment is a bigger deal than creating or viewing one. Confirm this matches what the team actually wants before demo night.'
  /* #swagger.security = [{ "bearerAuth": [] }] */
  /* #swagger.parameters['id'] = { in: 'path', description: 'PaymentID', required: true, schema: { type: 'integer' } } */
  /* #swagger.responses[200] = { description: 'Payment deleted.' } */
  /* #swagger.responses[404] = { description: 'Payment not found.' } */
  verifyToken,
  requireRole("Operator", "Admin"),
  paymentsController.deletePayment
);

module.exports = router;
