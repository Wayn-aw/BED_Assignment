/*
Owner: Kyra 
Feature: Patron Feedback (US5)
*/

const express = require("express");
const router = express.Router();
const feedbackController = require("../controllers/feedback.controller");
const { verifyToken, requireRole } = require("../middlewares/auth.middleware");

router.post("/", verifyToken, requireRole("Patron"), feedbackController.createFeedback);
router.get("/stall/:id", feedbackController.getFeedbackForStall);
router.put("/:id", verifyToken, requireRole("Patron"), feedbackController.updateFeedback);
router.delete("/:id", verifyToken, requireRole("Patron", "Admin"), feedbackController.deleteFeedback);

module.exports = router;
