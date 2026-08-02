/*
Owner: Yongsheng
Feature: Vendor Rental Tracking (US7)
*/

const express = require("express");
const router = express.Router();
const rentalsController = require("../controllers/rentals.controller");
const { verifyToken, requireRole } = require("../middlewares/auth.middleware");

router.post(
  "/",
  // #swagger.tags = ['Rentals']
  // #swagger.summary = 'Create a rental agreement (Operator / Admin only)'
  // #swagger.description = 'Stalls can have multiple historical agreements, e.g. from renewals. endDate must not be before startDate.'
  /* #swagger.security = [{ "bearerAuth": [] }] */
  /* #swagger.requestBody = { required: true, content: { "application/json": { schema: { type: "object", required: ["stallId", "startDate", "endDate", "monthlyRent"], properties: { stallId: { type: "integer", example: 1 }, startDate: { type: "string", format: "date", example: "2026-01-01" }, endDate: { type: "string", format: "date", example: "2026-12-31" }, monthlyRent: { type: "number", example: 1200.5 } } } } } } */
  /* #swagger.responses[201] = { description: 'Rental agreement created.' } */
  /* #swagger.responses[400] = { description: 'Missing field, endDate before startDate, or negative monthlyRent.' } */
  /* #swagger.responses[404] = { description: 'Stall not found.' } */
  verifyToken,
  requireRole("Operator", "Admin"),
  rentalsController.createAgreement
);

router.get(
  "/stall/:id",
  // #swagger.tags = ['Rentals']
  // #swagger.summary = 'Get the full rental history for a stall'
  /* #swagger.security = [{ "bearerAuth": [] }] */
  /* #swagger.parameters['id'] = { in: 'path', description: 'StallID', required: true, schema: { type: 'integer' } } */
  /* #swagger.responses[200] = { description: 'Rental agreements returned (may be an empty array).' } */
  verifyToken,
  requireRole("Operator", "Vendor", "Admin"),
  rentalsController.getAgreementsForStall
);

router.put(
  "/:id",
  // #swagger.tags = ['Rentals']
  // #swagger.summary = 'Update a rental agreement (Operator / Admin only)'
  // #swagger.description = 'Any field left out keeps its current value. status must be Active, Expired or Terminated.'
  /* #swagger.security = [{ "bearerAuth": [] }] */
  /* #swagger.parameters['id'] = { in: 'path', description: 'RentalAgreementID', required: true, schema: { type: 'integer' } } */
  /* #swagger.requestBody = { required: false, content: { "application/json": { schema: { type: "object", properties: { endDate: { type: "string", format: "date" }, monthlyRent: { type: "number" }, status: { type: "string", enum: ["Active", "Expired", "Terminated"] } } } } } } */
  /* #swagger.responses[200] = { description: 'Rental agreement updated.' } */
  /* #swagger.responses[400] = { description: 'status is not one of the allowed values.' } */
  /* #swagger.responses[404] = { description: 'Rental agreement not found.' } */
  verifyToken,
  requireRole("Operator", "Admin"),
  rentalsController.updateAgreement
);

router.delete(
  "/:id",
  // #swagger.tags = ['Rentals']
  // #swagger.summary = 'Delete a rental agreement (Operator / Admin only)'
  /* #swagger.security = [{ "bearerAuth": [] }] */
  /* #swagger.parameters['id'] = { in: 'path', description: 'RentalAgreementID', required: true, schema: { type: 'integer' } } */
  /* #swagger.responses[200] = { description: 'Rental agreement deleted.' } */
  /* #swagger.responses[404] = { description: 'Rental agreement not found.' } */
  verifyToken,
  requireRole("Operator", "Admin"),
  rentalsController.deleteAgreement
);

module.exports = router;
