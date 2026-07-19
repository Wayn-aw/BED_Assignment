/**
 * routes/rentals.routes.js
 * Owner: Yongsheng | Feature: Vendor Rental Tracking (US7)
 */

const express = require("express");
const router = express.Router();
const rentalsController = require("../controllers/rentals.controller");
const { verifyToken, requireRole } = require("../middlewares/auth.middleware");

router.post("/", verifyToken, requireRole("Operator", "Admin"), rentalsController.createAgreement);
router.get("/stall/:id", verifyToken, requireRole("Operator", "Vendor", "Admin"), rentalsController.getAgreementsForStall);
router.put("/:id", verifyToken, requireRole("Operator", "Admin"), rentalsController.updateAgreement);
router.delete("/:id", verifyToken, requireRole("Operator", "Admin"), rentalsController.deleteAgreement);

module.exports = router;
