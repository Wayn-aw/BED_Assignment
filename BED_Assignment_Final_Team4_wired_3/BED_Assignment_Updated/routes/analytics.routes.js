/*
Owner: Yongsheng
Feature: Operator Sales Analytics (US11)
*/

const express = require("express");
const router = express.Router();
const analyticsController = require("../controllers/analytics.controller");
const { verifyToken, requireRole } = require("../middlewares/auth.middleware");

router.get(
  "/sales/:stallId",
  // #swagger.tags = ['Analytics']
  // #swagger.summary = 'Get sales analytics for a stall (Operator / Vendor / Admin only)'
  // #swagger.description = 'Returns total revenue, total order count, the most popular menu items, and peak ordering hours for the given stall.'
  /* #swagger.security = [{ "bearerAuth": [] }] */
  /* #swagger.parameters['stallId'] = { in: 'path', description: 'StallID', required: true, schema: { type: 'integer' } } */
  /* #swagger.responses[200] = { description: 'Analytics returned: totalRevenue, totalOrders, popularItems, peakHours.' } */
  /* #swagger.responses[403] = { description: 'Caller is not an Operator, Vendor or Admin.' } */
  verifyToken,
  requireRole("Operator", "Vendor", "Admin"),
  analyticsController.getSalesAnalytics
);

module.exports = router;
