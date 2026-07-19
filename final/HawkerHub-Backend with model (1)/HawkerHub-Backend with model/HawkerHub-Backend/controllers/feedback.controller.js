/**
 * controllers/feedback.controller.js
 * Owner: Kyra | Feature: Patron Feedback (US5)
 */

const feedbackModel = require("../models/feedback.model");
const stallModel = require("../models/stall.model");

// ---- CREATE ----
exports.createFeedback = async (req, res, next) => {
  try {
    const { stallId, rating, comments } = req.body;
    if (!stallId || !rating) {
      return res.status(400).json({ success: false, message: "stallId and rating are required." });
    }
    if (rating < 1 || rating > 5) {
      return res.status(400).json({ success: false, message: "rating must be between 1 and 5." });
    }

    const stallExists = await stallModel.exists(stallId);
    if (!stallExists) {
      return res.status(404).json({ success: false, message: "Stall not found." });
    }

    const feedback = await feedbackModel.create({ patronId: req.user.userId, stallId, rating, comments });
    res.status(201).json({ success: true, message: "Feedback submitted.", data: feedback });
  } catch (err) {
    next(err);
  }
};

// ---- READ: all feedback for a stall ----
exports.getFeedbackForStall = async (req, res, next) => {
  try {
    const feedback = await feedbackModel.findByStallId(req.params.id);
    res.status(200).json({ success: true, count: feedback.length, data: feedback });
  } catch (err) {
    next(err);
  }
};

// ---- UPDATE: patron edits their own feedback ----
exports.updateFeedback = async (req, res, next) => {
  try {
    const { rating, comments } = req.body;
    if (rating && (rating < 1 || rating > 5)) {
      return res.status(400).json({ success: false, message: "rating must be between 1 and 5." });
    }

    const existing = await feedbackModel.findById(req.params.id);
    if (!existing) {
      return res.status(404).json({ success: false, message: "Feedback not found." });
    }
    if (existing.PatronID !== req.user.userId) {
      return res.status(403).json({ success: false, message: "You can only edit your own feedback." });
    }

    const updated = await feedbackModel.update(req.params.id, {
      rating: rating ?? existing.Rating,
      comments: comments ?? existing.Comments,
    });
    res.status(200).json({ success: true, message: "Feedback updated.", data: updated });
  } catch (err) {
    next(err);
  }
};

// ---- DELETE ----
exports.deleteFeedback = async (req, res, next) => {
  try {
    const existing = await feedbackModel.findById(req.params.id);
    if (!existing) {
      return res.status(404).json({ success: false, message: "Feedback not found." });
    }
    if (existing.PatronID !== req.user.userId && req.user.role !== "Admin") {
      return res.status(403).json({ success: false, message: "You can only delete your own feedback." });
    }

    await feedbackModel.remove(req.params.id);
    res.status(200).json({ success: true, message: "Feedback deleted." });
  } catch (err) {
    next(err);
  }
};
