/*
Owner: Kyra
Feature: Lodge Customer Complaint (US13)
*/

const express = require("express");
const router = express.Router();
const complaintsController = require("../controllers/complaints.controller");
const { verifyToken, requireRole } = require("../middlewares/auth.middleware");

router.post(
  "/",
  // #swagger.tags = ['Complaints']
  // #swagger.summary = 'Lodge a complaint against a stall (Patron only)'
  /* #swagger.security = [{ "bearerAuth": [] }] */
  /* #swagger.requestBody = { required: true, content: { "application/json": { schema: { type: "object", required: ["stallId", "description"], properties: { stallId: { type: "integer", example: 1 }, description: { type: "string", example: "The stall floor was very greasy and unswept." } } } } } } */
  /* #swagger.responses[201] = { description: 'Complaint submitted.' } */
  /* #swagger.responses[400] = { description: 'Missing field, or description shorter than 10 characters.' } */
  /* #swagger.responses[404] = { description: 'Stall not found.' } */
  verifyToken,
  requireRole("Patron"),
  complaintsController.createComplaint
);

router.get(
  "/mine",
  // #swagger.tags = ['Complaints']
  // #swagger.summary = "Get the logged-in Patron's own complaint history"
  /* #swagger.security = [{ "bearerAuth": [] }] */
  /* #swagger.responses[200] = { description: 'Complaints returned.' } */
  verifyToken,
  requireRole("Patron"),
  complaintsController.getMyComplaints
);

router.put(
  "/:id",
  // #swagger.tags = ['Complaints']
  // #swagger.summary = 'Update a complaint status (Operator / Admin only)'
  // #swagger.description = 'status must be one of Open, Investigating, Resolved, Dismissed.'
  /* #swagger.security = [{ "bearerAuth": [] }] */
  /* #swagger.parameters['id'] = { in: 'path', description: 'ComplaintID', required: true, schema: { type: 'integer' } } */
  /* #swagger.requestBody = { required: true, content: { "application/json": { schema: { type: "object", required: ["status"], properties: { status: { type: "string", enum: ["Open", "Investigating", "Resolved", "Dismissed"] } } } } } } */
  /* #swagger.responses[200] = { description: 'Complaint status updated.' } */
  /* #swagger.responses[400] = { description: 'status is not one of the allowed values.' } */
  /* #swagger.responses[404] = { description: 'Complaint not found.' } */
  verifyToken,
  requireRole("Operator", "Admin"),
  complaintsController.updateComplaintStatus
);

module.exports = router;
