/*
Owner: Kyra
Feature: Patron Feedback (US5)
*/

const express = require("express");
const router = express.Router();
const feedbackController = require("../controllers/feedback.controller");
const { verifyToken, requireRole } = require("../middlewares/auth.middleware");

router.post(
  "/",
  // #swagger.tags = ['Feedback']
  // #swagger.summary = 'Submit feedback for a stall (Patron only)'
  /* #swagger.security = [{ "bearerAuth": [] }] */
  /* #swagger.requestBody = { required: true, content: { "application/json": { schema: { $ref: "#/components/schemas/FeedbackRequest" } } } } */
  /* #swagger.responses[201] = { description: 'Feedback submitted.' } */
  /* #swagger.responses[400] = { description: 'Missing stallId/rating, or rating outside 1-5.' } */
  /* #swagger.responses[404] = { description: 'Stall not found.' } */
  verifyToken,
  requireRole("Patron"),
  feedbackController.createFeedback
);

router.get(
  "/stall/:id",
  // #swagger.tags = ['Feedback']
  // #swagger.summary = 'Get all feedback for a stall (public)'
  /* #swagger.parameters['id'] = { in: 'path', description: 'StallID', required: true, schema: { type: 'integer' } } */
  /* #swagger.responses[200] = { description: 'Feedback list returned.' } */
  feedbackController.getFeedbackForStall
);

router.put(
  "/:id",
  // #swagger.tags = ['Feedback']
  // #swagger.summary = 'Edit your own feedback (Patron only)'
  /* #swagger.security = [{ "bearerAuth": [] }] */
  /* #swagger.parameters['id'] = { in: 'path', description: 'FeedbackID', required: true, schema: { type: 'integer' } } */
  /* #swagger.requestBody = { required: false, content: { "application/json": { schema: { type: "object", properties: { rating: { type: "integer", minimum: 1, maximum: 5 }, comments: { type: "string" } } } } } } */
  /* #swagger.responses[200] = { description: 'Feedback updated.' } */
  /* #swagger.responses[403] = { description: 'Caller does not own this feedback.' } */
  /* #swagger.responses[404] = { description: 'Feedback not found.' } */
  verifyToken,
  requireRole("Patron"),
  feedbackController.updateFeedback
);

router.delete(
  "/:id",
  // #swagger.tags = ['Feedback']
  // #swagger.summary = 'Delete feedback (owner Patron or Admin)'
  /* #swagger.security = [{ "bearerAuth": [] }] */
  /* #swagger.parameters['id'] = { in: 'path', description: 'FeedbackID', required: true, schema: { type: 'integer' } } */
  /* #swagger.responses[200] = { description: 'Feedback deleted.' } */
  /* #swagger.responses[403] = { description: 'Caller does not own this feedback and is not an Admin.' } */
  /* #swagger.responses[404] = { description: 'Feedback not found.' } */
  verifyToken,
  requireRole("Patron", "Admin"),
  feedbackController.deleteFeedback
);

module.exports = router;
