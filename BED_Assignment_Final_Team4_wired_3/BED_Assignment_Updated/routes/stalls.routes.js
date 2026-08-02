/*
Owner: Kyra
Feature: Browse Food Stalls & Menu (US1)
*/

const express = require("express");
const router = express.Router();
const stallsController = require("../controllers/stalls.controller");
const { verifyToken, requireRole } = require("../middlewares/auth.middleware");

router.get(
  "/",
  // #swagger.tags = ['Stalls']
  // #swagger.summary = 'List all food stalls (public)'
  /* #swagger.responses[200] = { description: 'Stalls returned.' } */
  stallsController.getAllStalls
);

router.post(
  "/",
  // #swagger.tags = ['Stalls']
  // #swagger.summary = 'Admit a new stall into a hawker centre (Operator / Admin only)'
  /* #swagger.security = [{ "bearerAuth": [] }] */
  /* #swagger.requestBody = { required: true, content: { "application/json": { schema: { type: "object", required: ["centreId", "ownerId", "stallName"], properties: { centreId: { type: "integer", example: 1 }, ownerId: { type: "integer", example: 3, description: "must be a UserID with the Vendor role" }, stallName: { type: "string", example: "Second Stall by Ah Hock" }, description: { type: "string" }, imageUrl: { type: "string" } } } } } } */
  /* #swagger.responses[201] = { description: 'Stall created.' } */
  /* #swagger.responses[400] = { description: 'Missing field, or ownerId is not a Vendor.' } */
  /* #swagger.responses[404] = { description: 'Hawker centre not found.' } */
  verifyToken,
  requireRole("Operator", "Admin"),
  stallsController.createStall
);

router.get(
  "/:id",
  // #swagger.tags = ['Stalls']
  // #swagger.summary = 'Get a stall and its full menu (public)'
  /* #swagger.parameters['id'] = { in: 'path', description: 'StallID', required: true, schema: { type: 'integer' } } */
  /* #swagger.responses[200] = { description: 'Stall with its menu array returned.' } */
  /* #swagger.responses[404] = { description: 'Stall not found.' } */
  stallsController.getStallById
);

router.put(
  "/:id",
  // #swagger.tags = ['Stalls']
  // #swagger.summary = "Edit a stall's display details (owning Vendor, or Operator/Admin)"
  /* #swagger.security = [{ "bearerAuth": [] }] */
  /* #swagger.parameters['id'] = { in: 'path', description: 'StallID', required: true, schema: { type: 'integer' } } */
  /* #swagger.requestBody = { required: false, content: { "application/json": { schema: { type: "object", properties: { stallName: { type: "string" }, description: { type: "string" }, imageUrl: { type: "string" } } } } } } */
  /* #swagger.responses[200] = { description: 'Stall updated.' } */
  /* #swagger.responses[403] = { description: 'Caller neither owns this stall nor is Operator/Admin.' } */
  /* #swagger.responses[404] = { description: 'Stall not found.' } */
  verifyToken,
  requireRole("Vendor", "Operator", "Admin"),
  stallsController.updateStall
);

router.delete(
  "/:id",
  // #swagger.tags = ['Stalls']
  // #swagger.summary = 'Retire a stall (Operator / Admin only)'
  // #swagger.description = 'Fails with 409 if the stall still has menu items, orders, promotions, feedback, complaints, inspections or rental agreements pointing at it - clear those first.'
  /* #swagger.security = [{ "bearerAuth": [] }] */
  /* #swagger.parameters['id'] = { in: 'path', description: 'StallID', required: true, schema: { type: 'integer' } } */
  /* #swagger.responses[200] = { description: 'Stall deleted.' } */
  /* #swagger.responses[404] = { description: 'Stall not found.' } */
  /* #swagger.responses[409] = { description: 'Stall is still referenced by other records.' } */
  verifyToken,
  requireRole("Operator", "Admin"),
  stallsController.deleteStall
);

module.exports = router;
