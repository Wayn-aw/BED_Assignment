/*
Owner: Jeremiah
Feature: NEA Hygiene Inspections & Grades (US4, US12)
*/

const express = require("express");
const router = express.Router();
const inspectionsController = require("../controllers/inspections.controller");
const { verifyToken, requireRole } = require("../middlewares/auth.middleware");

router.post(
  "/",
  // #swagger.tags = ['Inspections']
  // #swagger.summary = 'Log a hygiene inspection (NEA Officer only)'
  // #swagger.description = 'Automatically derives and inserts a hygiene grade (A/B/C/D) from the score.'
  /* #swagger.security = [{ "bearerAuth": [] }] */
  /* #swagger.requestBody = { required: true, content: { "application/json": { schema: { type: "object", required: ["stallId", "score"], properties: { stallId: { type: "integer", example: 1 }, score: { type: "number", example: 88, description: "0-100" }, remarks: { type: "string", example: "Clean workstation, minor grease buildup near sink." } } } } } } */
  /* #swagger.responses[201] = { description: 'Inspection recorded and hygiene grade returned.' } */
  /* #swagger.responses[400] = { description: 'Missing field, or score outside 0-100.' } */
  /* #swagger.responses[404] = { description: 'Stall not found.' } */
  verifyToken,
  requireRole("NEAOfficer"),
  inspectionsController.createInspection
);

router.get(
  "/stall/:id",
  // #swagger.tags = ['Inspections']
  // #swagger.summary = 'Get the inspection and hygiene grade history for a stall (public)'
  // #swagger.description = 'Public for transparency, so patrons and vendors can see historical hygiene grades.'
  /* #swagger.parameters['id'] = { in: 'path', description: 'StallID', required: true, schema: { type: 'integer' } } */
  /* #swagger.responses[200] = { description: 'Inspection history returned.' } */
  inspectionsController.getInspectionHistory
);

router.put(
  "/:id",
  // #swagger.tags = ['Inspections']
  // #swagger.summary = 'Amend an inspection you recorded (NEA Officer only)'
  /* #swagger.security = [{ "bearerAuth": [] }] */
  /* #swagger.parameters['id'] = { in: 'path', description: 'InspectionID', required: true, schema: { type: 'integer' } } */
  /* #swagger.requestBody = { required: false, content: { "application/json": { schema: { type: "object", properties: { score: { type: "number" }, remarks: { type: "string" } } } } } } */
  /* #swagger.responses[200] = { description: 'Inspection updated.' } */
  /* #swagger.responses[403] = { description: 'Caller did not record this inspection.' } */
  /* #swagger.responses[404] = { description: 'Inspection not found.' } */
  verifyToken,
  requireRole("NEAOfficer"),
  inspectionsController.updateInspection
);

router.delete(
  "/:id",
  // #swagger.tags = ['Inspections']
  // #swagger.summary = 'Delete an inspection you recorded (NEA Officer only)'
  /* #swagger.security = [{ "bearerAuth": [] }] */
  /* #swagger.parameters['id'] = { in: 'path', description: 'InspectionID', required: true, schema: { type: 'integer' } } */
  /* #swagger.responses[200] = { description: 'Inspection record deleted.' } */
  /* #swagger.responses[403] = { description: 'Caller did not record this inspection.' } */
  /* #swagger.responses[404] = { description: 'Inspection not found.' } */
  verifyToken,
  requireRole("NEAOfficer"),
  inspectionsController.deleteInspection
);

module.exports = router;
