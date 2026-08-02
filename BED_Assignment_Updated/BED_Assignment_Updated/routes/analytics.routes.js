/*
Owner: Yongsheng 
Feature: Operator Sales Analytics (US11)
*/

const express = require("express");
const router = express.Router();
const analyticsController = require("../controllers/analytics.controller");
const { verifyToken, requireRole } = require("../middlewares/auth.middleware");

router.get("/sales/:stallId", verifyToken, requireRole("Operator", "Vendor", "Admin"), analyticsController.getSalesAnalytics);

module.exports = router;
