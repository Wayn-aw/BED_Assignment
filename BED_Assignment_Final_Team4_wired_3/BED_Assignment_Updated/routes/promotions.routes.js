/*
Owner: Jeremiah
Feature: Vendor Promotions (US14)
*/

const express = require("express");
const router = express.Router();
const promotionsController = require("../controllers/promotions.controller");
const { verifyToken, requireRole } = require("../middlewares/auth.middleware");

router.post(
  "/",
  // #swagger.tags = ['Promotions']
  // #swagger.summary = 'Create a promotion (Vendor only, own stall)'
  /* #swagger.security = [{ "bearerAuth": [] }] */
  /* #swagger.requestBody = { required: true, content: { "application/json": { schema: { type: "object", required: ["stallId", "title", "discountPercentage", "startDate", "endDate"], properties: { stallId: { type: "integer", example: 1 }, title: { type: "string", example: "National Day Special" }, discountPercentage: { type: "number", example: 20, description: "1-100" }, startDate: { type: "string", format: "date", example: "2026-08-09" }, endDate: { type: "string", format: "date", example: "2026-08-16" } } } } } } */
  /* #swagger.responses[201] = { description: 'Promotion created.' } */
  /* #swagger.responses[400] = { description: 'Missing field, discountPercentage outside 1-100, or endDate not after startDate.' } */
  /* #swagger.responses[403] = { description: 'Caller does not own this stall.' } */
  verifyToken,
  requireRole("Vendor"),
  promotionsController.createPromotion
);

router.get(
  "/stall/:id",
  // #swagger.tags = ['Promotions']
  // #swagger.summary = 'Get all promotions for a stall (public)'
  /* #swagger.parameters['id'] = { in: 'path', description: 'StallID', required: true, schema: { type: 'integer' } } */
  /* #swagger.responses[200] = { description: 'Promotions returned.' } */
  promotionsController.getPromotionsForStall
);

router.delete(
  "/:id",
  // #swagger.tags = ['Promotions']
  // #swagger.summary = 'Delete a promotion (Vendor only, own stall)'
  /* #swagger.security = [{ "bearerAuth": [] }] */
  /* #swagger.parameters['id'] = { in: 'path', description: 'PromotionID', required: true, schema: { type: 'integer' } } */
  /* #swagger.responses[200] = { description: 'Promotion deleted.' } */
  /* #swagger.responses[403] = { description: 'Caller does not own this promotion.' } */
  /* #swagger.responses[404] = { description: 'Promotion not found.' } */
  verifyToken,
  requireRole("Vendor"),
  promotionsController.deletePromotion
);

router.put(
  "/:id",
  // #swagger.tags = ['Promotions']
  // #swagger.summary = 'Edit a promotion (Vendor only, own stall)'
  // #swagger.description = 'Any field left out keeps its current value.'
  /* #swagger.security = [{ "bearerAuth": [] }] */
  /* #swagger.parameters['id'] = { in: 'path', description: 'PromotionID', required: true, schema: { type: 'integer' } } */
  /* #swagger.requestBody = { required: false, content: { "application/json": { schema: { type: "object", properties: { title: { type: "string" }, discountPercentage: { type: "number" }, startDate: { type: "string", format: "date" }, endDate: { type: "string", format: "date" } } } } } } */
  /* #swagger.responses[200] = { description: 'Promotion updated.' } */
  /* #swagger.responses[400] = { description: 'discountPercentage outside 1-100, or endDate not after startDate.' } */
  /* #swagger.responses[403] = { description: 'Caller does not own this promotion.' } */
  /* #swagger.responses[404] = { description: 'Promotion not found.' } */
  verifyToken,
  requireRole("Vendor"),
  promotionsController.updatePromotion
);

module.exports = router;
