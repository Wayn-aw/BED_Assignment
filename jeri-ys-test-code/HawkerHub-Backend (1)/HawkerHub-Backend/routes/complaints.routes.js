/**
 * routes/complaints.routes.js
 * Owner: Kyra | Feature: Lodge Customer Complaint (US13)
 */

const express = require("express");
const router = express.Router();
const complaintsController = require("../controllers/complaints.controller");
const { verifyToken, requireRole } = require("../middlewares/auth.middleware");

router.post("/", verifyToken, requireRole("Patron"), complaintsController.createComplaint);
router.get("/mine", verifyToken, requireRole("Patron"), complaintsController.getMyComplaints);
router.put("/:id", verifyToken, requireRole("Operator", "Admin"), complaintsController.updateComplaintStatus);

module.exports = router;
