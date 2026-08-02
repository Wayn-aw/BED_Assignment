/*
Owner: Wayne
Feature: Vendor Menu CRUD (US6)
*/

const express = require("express");
const router = express.Router();
const menuController = require("../controllers/menu.controller");
const { verifyToken, requireRole } = require("../middlewares/auth.middleware");

router.post(
  "/",
  // #swagger.tags = ['Menu']
  // #swagger.summary = 'Create a menu item (Vendor only, own stall)'
  /* #swagger.security = [{ "bearerAuth": [] }] */
  /* #swagger.requestBody = { required: true, content: { "application/json": { schema: { $ref: "#/components/schemas/MenuItemRequest" } } } } */
  /* #swagger.responses[201] = { description: 'Menu item created.' } */
  /* #swagger.responses[400] = { description: 'Missing field, negative price, or invalid category.' } */
  /* #swagger.responses[403] = { description: 'Caller does not own this stall.' } */
  verifyToken,
  requireRole("Vendor"),
  menuController.createMenuItem
);

router.get(
  "/:id",
  // #swagger.tags = ['Menu']
  // #swagger.summary = 'Get a menu item by ID (public)'
  /* #swagger.parameters['id'] = { in: 'path', description: 'ItemID', required: true, schema: { type: 'integer' } } */
  /* #swagger.responses[200] = { description: 'Menu item returned.' } */
  /* #swagger.responses[404] = { description: 'Menu item not found.' } */
  menuController.getMenuItemById
);

router.put(
  "/:id",
  // #swagger.tags = ['Menu']
  // #swagger.summary = 'Update a menu item (Vendor only, own stall)'
  /* #swagger.security = [{ "bearerAuth": [] }] */
  /* #swagger.parameters['id'] = { in: 'path', description: 'ItemID', required: true, schema: { type: 'integer' } } */
  /* #swagger.requestBody = { required: false, content: { "application/json": { schema: { type: "object", properties: { itemName: { type: "string" }, description: { type: "string" }, price: { type: "number" }, category: { type: "string", enum: ["Main", "Drink", "Dessert", "Side"] }, isAvailable: { type: "boolean" }, imageUrl: { type: "string" } } } } } } */
  /* #swagger.responses[200] = { description: 'Menu item updated.' } */
  /* #swagger.responses[403] = { description: 'Caller does not own this item.' } */
  /* #swagger.responses[404] = { description: 'Menu item not found.' } */
  verifyToken,
  requireRole("Vendor"),
  menuController.updateMenuItem
);

router.delete(
  "/:id",
  // #swagger.tags = ['Menu']
  // #swagger.summary = 'Delete a menu item (Vendor only, own stall)'
  /* #swagger.security = [{ "bearerAuth": [] }] */
  /* #swagger.parameters['id'] = { in: 'path', description: 'ItemID', required: true, schema: { type: 'integer' } } */
  /* #swagger.responses[200] = { description: 'Menu item deleted.' } */
  /* #swagger.responses[403] = { description: 'Caller does not own this item.' } */
  /* #swagger.responses[404] = { description: 'Menu item not found.' } */
  verifyToken,
  requireRole("Vendor"),
  menuController.deleteMenuItem
);

module.exports = router;
